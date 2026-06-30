import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, storeProfiles, actions, insights } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getModel } from '@/lib/ai/model';
import { sendPushNotification } from '@/lib/notifications/push';

export const maxDuration = 300;

const INSIGHT_TYPES = [
  'channel_tip',
  'audience_segment',
  'seasonal',
  'product_positioning',
  'retention_tip',
  'pricing_insight',
] as const;

type InsightType = (typeof INSIGHT_TYPES)[number];

interface InsightOutput {
  type: InsightType;
  content: string;
}

async function generateInsight(params: {
  productType: string | null;
  storePlatform: string | null;
  targetCustomer: string | null;
  priceRange: string | null;
  nicheSummary: string | null;
  actionHistory: string;
  totalSales: number;
  streak: number;
}): Promise<InsightOutput | null> {
  const {
    productType, storePlatform, targetCustomer, priceRange,
    nicheSummary, actionHistory, totalSales, streak,
  } = params;

  const prompt = `You are a marketing strategist for Stormo.io — a platform that helps ecommerce merchants get their first customers.

Based on the merchant's store profile and recent activity, generate ONE strategic insight that would genuinely help them improve their marketing approach.

This is NOT a task or to-do. It is a strategic observation — something they might not have noticed or thought of. Keep it to 2-3 sentences. Be specific and practical.

STORE PROFILE:
- Product: ${productType ?? 'unknown'}
- Platform: ${storePlatform ?? 'unknown'}
- Target customer: ${targetCustomer ?? 'unknown'}
- Price range: ${priceRange ?? 'unknown'}
- Niche summary: ${nicheSummary ?? 'not available'}

RECENT COMPLETED ACTIONS (last 10):
${actionHistory || 'No recent actions recorded.'}

METRICS:
- Total sales logged: ${totalSales}
- Current streak: ${streak} days

Output ONLY valid JSON in this exact format, no other text:
{
  "type": "channel_tip|audience_segment|seasonal|product_positioning|retention_tip|pricing_insight",
  "content": "Your 2-3 sentence insight here."
}`;

  const model = getModel();
  const response = await model.invoke(prompt);
  const text = typeof response.content === 'string'
    ? response.content
    : JSON.stringify(response.content);

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  const parsed = JSON.parse(match[0]) as InsightOutput;
  if (!parsed.content || !INSIGHT_TYPES.includes(parsed.type)) return null;

  return parsed;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let processed = 0;
  let generated = 0;
  let errors = 0;

  const eligibleUsers = await db
    .select({
      id: users.id,
      totalSales: users.totalSales,
      growthUnlocked: users.growthUnlocked,
    })
    .from(users)
    .where(
      and(
        eq(users.onboardingCompleted, true),
        eq(users.subscriptionStatus, 'active')
      )
    );

  for (const user of eligibleUsers) {
    processed++;

    try {
      // Store profile
      const [profile] = await db
        .select({
          productType: storeProfiles.productType,
          storePlatform: storeProfiles.storePlatform,
          targetCustomer: storeProfiles.targetCustomer,
          priceRange: storeProfiles.priceRange,
          nicheSummary: storeProfiles.nicheSummary,
        })
        .from(storeProfiles)
        .where(eq(storeProfiles.userId, user.id))
        .limit(1);

      // Recent completed actions for context
      const recentActions = await db
        .select({ channel: actions.channel, actionType: actions.actionType, completedAt: actions.completedAt })
        .from(actions)
        .where(and(eq(actions.userId, user.id), eq(actions.status, 'completed')))
        .orderBy(desc(actions.completedAt))
        .limit(10);

      const actionHistory = recentActions
        .map((a) => `- ${a.channel ?? 'unknown'} (${a.actionType ?? 'general'}) on ${a.completedAt?.toISOString().split('T')[0] ?? 'unknown date'}`)
        .join('\n');

      // Streak calc
      const dates = Array.from(
        new Set(recentActions.map((a) => a.completedAt?.toISOString().split('T')[0]).filter(Boolean) as string[])
      ).sort((a, b) => b.localeCompare(a));

      let streak = 0;
      if (dates.length > 0) {
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        if (dates[0] === today || dates[0] === yesterday) {
          const cursor = new Date(dates[0]);
          for (const d of dates) {
            if (d === cursor.toISOString().split('T')[0]) { streak++; cursor.setDate(cursor.getDate() - 1); }
            else break;
          }
        }
      }

      const insight = await generateInsight({
        productType: profile?.productType ?? null,
        storePlatform: profile?.storePlatform ?? null,
        targetCustomer: profile?.targetCustomer ?? null,
        priceRange: profile?.priceRange ?? null,
        nicheSummary: profile?.nicheSummary ?? null,
        actionHistory,
        totalSales: user.totalSales ?? 0,
        streak,
      });

      if (!insight) {
        console.warn(`[cron/insights] No valid insight returned for user ${user.id}`);
        continue;
      }

      await db.insert(insights).values({
        userId: user.id,
        content: insight.content,
        insightType: insight.type,
        isRead: false,
      });

      // Optional push notification for new insight
      sendPushNotification(user.id, {
        title: 'New insight for your store 💡',
        body: insight.content.slice(0, 100) + (insight.content.length > 100 ? '…' : ''),
        url: '/dashboard',
        tag: 'insight',
      }).catch(() => {});

      generated++;
    } catch (err: any) {
      console.error(`[cron/insights] Failed for user ${user.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ success: true, processed, generated, errors });
}
