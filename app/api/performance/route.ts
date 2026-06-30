import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { actions, actionResults, strategyPerformance } from '@/lib/db/schema';
import { eq, and, desc, gte, sql, count } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 1. Count completed actions that have results logged
    const [{ completedWithResults }] = await db
      .select({
        completedWithResults: count(),
      })
      .from(actionResults)
      .where(eq(actionResults.userId, userId));

    if (completedWithResults < 20) {
      return NextResponse.json({ eligible: false, completedWithResults });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000);

    // 2. Platform breakdown (from strategyPerformance, refreshed nightly)
    const platforms = await db
      .select({
        platform: strategyPerformance.platform,
        actionCount: strategyPerformance.actionCount,
        avgEngagementRate: strategyPerformance.avgEngagementRate,
        avgConversionRate: strategyPerformance.avgConversionRate,
        totalAttributedSales: strategyPerformance.totalAttributedSales,
      })
      .from(strategyPerformance)
      .where(eq(strategyPerformance.userId, userId))
      .orderBy(desc(strategyPerformance.totalAttributedSales));

    // 3. Action type comparison (group platforms by actionType from strategyPerformance)
    const actionTypeMap = new Map<string, {
      actionCount: number;
      totalSales: number;
      engRateSum: number;
      convRateSum: number;
      rows: number;
    }>();

    for (const row of platforms) {
      const key = row.platform ?? 'unknown';
      const existing = actionTypeMap.get(key) ?? { actionCount: 0, totalSales: 0, engRateSum: 0, convRateSum: 0, rows: 0 };
      existing.actionCount += row.actionCount ?? 0;
      existing.totalSales += row.totalAttributedSales ?? 0;
      existing.engRateSum += parseFloat((row.avgEngagementRate ?? '0').replace('%', '')) || 0;
      existing.convRateSum += parseFloat((row.avgConversionRate ?? '0').replace('%', '')) || 0;
      existing.rows++;
      actionTypeMap.set(key, existing);
    }

    // Separate actionType grouping from the raw results
    const actionTypeRaw = await db
      .select({
        actionType: strategyPerformance.actionType,
        actionCount: strategyPerformance.actionCount,
        avgEngagementRate: strategyPerformance.avgEngagementRate,
        avgConversionRate: strategyPerformance.avgConversionRate,
        totalAttributedSales: strategyPerformance.totalAttributedSales,
      })
      .from(strategyPerformance)
      .where(eq(strategyPerformance.userId, userId));

    const actionTypeAgg = new Map<string, { actionCount: number; totalSales: number; engSum: number; convSum: number; n: number }>();
    for (const row of actionTypeRaw) {
      const key = row.actionType ?? 'general';
      const ex = actionTypeAgg.get(key) ?? { actionCount: 0, totalSales: 0, engSum: 0, convSum: 0, n: 0 };
      ex.actionCount += row.actionCount ?? 0;
      ex.totalSales += row.totalAttributedSales ?? 0;
      ex.engSum += parseFloat((row.avgEngagementRate ?? '0').replace('%', '')) || 0;
      ex.convSum += parseFloat((row.avgConversionRate ?? '0').replace('%', '')) || 0;
      ex.n++;
      actionTypeAgg.set(key, ex);
    }

    const actionTypes = Array.from(actionTypeAgg.entries())
      .map(([type, v]) => ({
        actionType: type,
        actionCount: v.actionCount,
        avgEngagementRate: (v.n > 0 ? (v.engSum / v.n).toFixed(1) : '0.0') + '%',
        avgConversionRate: (v.n > 0 ? (v.convSum / v.n).toFixed(2) : '0.00') + '%',
        totalAttributedSales: v.totalSales,
      }))
      .sort((a, b) => b.totalAttributedSales - a.totalAttributedSales);

    // 4. Top 5 actions by sales attributed
    const topActions = await db
      .select({
        id: actions.id,
        title: actions.title,
        channel: actions.channel,
        actionType: actions.actionType,
        scheduledFor: actions.scheduledFor,
        reach: actionResults.reach,
        engagement: actionResults.engagement,
        clicksToStore: actionResults.clicksToStore,
        salesAttributed: actionResults.salesAttributed,
      })
      .from(actionResults)
      .innerJoin(actions, eq(actionResults.actionId, actions.id))
      .where(eq(actionResults.userId, userId))
      .orderBy(desc(actionResults.salesAttributed))
      .limit(5);

    // 5. Conversion funnel — all-time totals
    const [funnel] = await db
      .select({
        totalReach: sql<number>`COALESCE(SUM(${actionResults.reach}), 0)`,
        totalEngagement: sql<number>`COALESCE(SUM(${actionResults.engagement}), 0)`,
        totalClicks: sql<number>`COALESCE(SUM(${actionResults.clicksToStore}), 0)`,
        totalSales: sql<number>`COALESCE(SUM(${actionResults.salesAttributed}), 0)`,
      })
      .from(actionResults)
      .where(eq(actionResults.userId, userId));

    const funnelReach = Number(funnel.totalReach);
    const funnelEng = Number(funnel.totalEngagement);
    const funnelClicks = Number(funnel.totalClicks);
    const funnelSales = Number(funnel.totalSales);

    // 6. 30-day trend — this month vs prior 30 days
    const [thisMonth] = await db
      .select({
        reach: sql<number>`COALESCE(SUM(${actionResults.reach}), 0)`,
        engagement: sql<number>`COALESCE(SUM(${actionResults.engagement}), 0)`,
        sales: sql<number>`COALESCE(SUM(${actionResults.salesAttributed}), 0)`,
      })
      .from(actionResults)
      .where(and(eq(actionResults.userId, userId), gte(actionResults.loggedAt, thirtyDaysAgo)));

    const [lastMonth] = await db
      .select({
        reach: sql<number>`COALESCE(SUM(${actionResults.reach}), 0)`,
        engagement: sql<number>`COALESCE(SUM(${actionResults.engagement}), 0)`,
        sales: sql<number>`COALESCE(SUM(${actionResults.salesAttributed}), 0)`,
      })
      .from(actionResults)
      .where(and(eq(actionResults.userId, userId), gte(actionResults.loggedAt, sixtyDaysAgo)));

    function pctChange(now: number, prev: number): string {
      const delta = now - prev;
      if (prev === 0) return now > 0 ? '+∞' : '0';
      const pct = Math.round((delta / prev) * 100);
      return (pct >= 0 ? '+' : '') + pct + '%';
    }

    const tm = { reach: Number(thisMonth.reach), engagement: Number(thisMonth.engagement), sales: Number(thisMonth.sales) };
    const lm = {
      reach: Number(lastMonth.reach) - tm.reach,
      engagement: Number(lastMonth.engagement) - tm.engagement,
      sales: Number(lastMonth.sales) - tm.sales,
    };

    return NextResponse.json({
      eligible: true,
      completedWithResults,
      platforms,
      actionTypes,
      topActions,
      funnel: {
        totalReach: funnelReach,
        totalEngagement: funnelEng,
        totalClicksToStore: funnelClicks,
        totalSalesAttributed: funnelSales,
        engagementRate: funnelReach > 0 ? ((funnelEng / funnelReach) * 100).toFixed(1) + '%' : '0.0%',
        clickRate: funnelReach > 0 ? ((funnelClicks / funnelReach) * 100).toFixed(1) + '%' : '0.0%',
        conversionRate: funnelReach > 0 ? ((funnelSales / funnelReach) * 100).toFixed(2) + '%' : '0.00%',
      },
      trend: {
        thisMonth: tm,
        lastMonth: lm,
        reachChange: pctChange(tm.reach, lm.reach),
        engagementChange: pctChange(tm.engagement, lm.engagement),
        salesChange: pctChange(tm.sales, lm.sales),
      },
    });
  } catch (err: any) {
    console.error('[GET /api/performance]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
