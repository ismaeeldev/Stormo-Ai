import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, actions, actionResults, strategyPerformance } from '@/lib/db/schema';
import { eq, and, gte, sql, count } from 'drizzle-orm';

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000);
  let processed = 0;
  let updated = 0;
  let skipped = 0;

  // Only process users with 20+ completed actions
  const eligibleUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.onboardingCompleted, true));

  for (const user of eligibleUsers) {
    try {
      // Count completed actions
      const [{ total }] = await db
        .select({ total: count() })
        .from(actions)
        .where(and(eq(actions.userId, user.id), eq(actions.status, 'completed')));

      processed++;

      if (total < 20) {
        skipped++;
        continue;
      }

      // Query all action_results from past 90 days joined with actions
      // Coalesce: prefer the denormalized platform/actionType on actionResults (set on newer records),
      // fall back to the source action's channel/actionType for historical records.
      const rows = await db
        .select({
          platform: sql<string>`COALESCE(${actionResults.platform}, ${actions.channel}, 'unknown')`,
          actionType: sql<string>`COALESCE(${actionResults.actionType}, ${actions.actionType}, 'general')`,
          reach: actionResults.reach,
          engagement: actionResults.engagement,
          salesAttributed: actionResults.salesAttributed,
        })
        .from(actionResults)
        .innerJoin(actions, eq(actionResults.actionId, actions.id))
        .where(
          and(
            eq(actionResults.userId, user.id),
            gte(actionResults.loggedAt, ninetyDaysAgo)
          )
        );

      if (rows.length === 0) {
        skipped++;
        continue;
      }

      // Group by (platform, actionType) in memory
      const grouped = new Map<string, {
        totalReach: number;
        totalEngagement: number;
        totalSales: number;
        count: number;
      }>();

      for (const row of rows) {
        const key = `${row.platform}::${row.actionType}`;
        const existing = grouped.get(key) ?? { totalReach: 0, totalEngagement: 0, totalSales: 0, count: 0 };
        existing.totalReach += row.reach ?? 0;
        existing.totalEngagement += row.engagement ?? 0;
        existing.totalSales += row.salesAttributed ?? 0;
        existing.count++;
        grouped.set(key, existing);
      }

      // Upsert into strategy_performance
      for (const [key, agg] of grouped.entries()) {
        const [platform, actionType] = key.split('::');
        const engRate = agg.totalReach > 0
          ? ((agg.totalEngagement / agg.totalReach) * 100).toFixed(1) + '%'
          : '0.0%';
        const convRate = agg.totalReach > 0
          ? ((agg.totalSales / agg.totalReach) * 100).toFixed(2) + '%'
          : '0.00%';

        // Find existing row for this user+platform+actionType
        const [existing] = await db
          .select({ id: strategyPerformance.id })
          .from(strategyPerformance)
          .where(
            and(
              eq(strategyPerformance.userId, user.id),
              eq(strategyPerformance.platform, platform),
              eq(strategyPerformance.actionType, actionType)
            )
          )
          .limit(1);

        if (existing) {
          await db
            .update(strategyPerformance)
            .set({
              avgEngagementRate: engRate,
              avgConversionRate: convRate,
              totalAttributedSales: agg.totalSales,
              actionCount: agg.count,
              lastUpdated: new Date(),
            })
            .where(eq(strategyPerformance.id, existing.id));
        } else {
          await db.insert(strategyPerformance).values({
            userId: user.id,
            platform,
            actionType,
            avgEngagementRate: engRate,
            avgConversionRate: convRate,
            totalAttributedSales: agg.totalSales,
            actionCount: agg.count,
            lastUpdated: new Date(),
          });
        }
      }

      updated++;
    } catch (err: any) {
      console.error(`[cron/aggregate-performance] Failed for user ${user.id}:`, err);
    }
  }

  return NextResponse.json({ success: true, processed, updated, skipped });
}
