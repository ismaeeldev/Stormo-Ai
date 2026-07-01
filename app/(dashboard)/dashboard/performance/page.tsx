import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BarChart2, TrendingUp, TrendingDown, Users, MousePointerClick, ShoppingBag, Zap, Trophy, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { actions, actionResults, strategyPerformance } from '@/lib/db/schema';
import { eq, and, desc, gte, sql, count } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Performance | Stormo.io',
  description: 'Your marketing performance data and channel breakdown.',
};

interface PlatformRow {
  platform: string | null;
  actionCount: number | null;
  avgEngagementRate: string | null;
  avgConversionRate: string | null;
  totalAttributedSales: number | null;
}

interface ActionTypeRow {
  actionType: string | null;
  actionCount: number | null;
  avgEngagementRate: string | null;
  avgConversionRate: string | null;
  totalAttributedSales: number | null;
}

interface TopAction {
  id: string;
  title: string | null;
  channel: string | null;
  actionType: string | null;
  scheduledFor: string | null;
  reach: number | null;
  engagement: number | null;
  clicksToStore: number | null;
  salesAttributed: number | null;
}

interface PerfData {
  eligible: boolean;
  completedWithResults: number;
  platforms: PlatformRow[];
  actionTypes: ActionTypeRow[];
  topActions: TopAction[];
  funnel: {
    totalReach: number;
    totalEngagement: number;
    totalClicksToStore: number;
    totalSalesAttributed: number;
    engagementRate: string;
    clickRate: string;
    conversionRate: string;
  };
  trend: {
    thisMonth: { reach: number; engagement: number; sales: number };
    lastMonth: { reach: number; engagement: number; sales: number };
    reachChange: string;
    engagementChange: string;
    salesChange: string;
  };
}

function parseRate(s: string | null) {
  return parseFloat((s ?? '0').replace('%', '')) || 0;
}

function TrendBadge({ value }: { value: string }) {
  const isPositive = value.startsWith('+') && value !== '+0%';
  const isNegative = value.startsWith('-');
  const cls = isPositive
    ? 'text-green-700 bg-green-50 border-green-200'
    : isNegative
    ? 'text-red-700 bg-red-50 border-red-200'
    : 'text-subtle bg-gray-50 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${cls}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : isNegative ? <TrendingDown className="h-3 w-3" /> : null}
      {value}
    </span>
  );
}

function BarRow({ label, value, max, sub }: { label: string; value: number; max: number; sub?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0 text-xs font-semibold text-dark capitalize truncate">{label}</div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 text-right">
        <span className="text-xs font-bold text-dark">{value}</span>
        {sub && <span className="text-[10px] text-subtle ml-1">{sub}</span>}
      </div>
    </div>
  );
}

async function getPerformanceData(userId: string): Promise<PerfData | null> {
  try {
    const [{ completedWithResults }] = await db
      .select({ completedWithResults: count() })
      .from(actionResults)
      .where(eq(actionResults.userId, userId));

    if (completedWithResults < 20) {
      return { eligible: false, completedWithResults, platforms: [], actionTypes: [], topActions: [], funnel: {} as PerfData['funnel'], trend: {} as PerfData['trend'] };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86_400_000);

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

    const [funnel] = await db
      .select({
        totalReach: sql<number>`COALESCE(SUM(${actionResults.reach}), 0)`,
        totalEngagement: sql<number>`COALESCE(SUM(${actionResults.engagement}), 0)`,
        totalClicks: sql<number>`COALESCE(SUM(${actionResults.clicksToStore}), 0)`,
        totalSales: sql<number>`COALESCE(SUM(${actionResults.salesAttributed}), 0)`,
      })
      .from(actionResults)
      .where(eq(actionResults.userId, userId));

    const [thisMonthRaw] = await db
      .select({
        reach: sql<number>`COALESCE(SUM(${actionResults.reach}), 0)`,
        engagement: sql<number>`COALESCE(SUM(${actionResults.engagement}), 0)`,
        sales: sql<number>`COALESCE(SUM(${actionResults.salesAttributed}), 0)`,
      })
      .from(actionResults)
      .where(and(eq(actionResults.userId, userId), gte(actionResults.loggedAt, thirtyDaysAgo)));

    const [lastMonthRaw] = await db
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

    const funnelReach = Number(funnel.totalReach);
    const funnelEng = Number(funnel.totalEngagement);
    const funnelClicks = Number(funnel.totalClicks);
    const funnelSales = Number(funnel.totalSales);

    const tm = { reach: Number(thisMonthRaw.reach), engagement: Number(thisMonthRaw.engagement), sales: Number(thisMonthRaw.sales) };
    const lm = {
      reach: Number(lastMonthRaw.reach) - tm.reach,
      engagement: Number(lastMonthRaw.engagement) - tm.engagement,
      sales: Number(lastMonthRaw.sales) - tm.sales,
    };

    return {
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
    };
  } catch (err) {
    console.error('[PerformancePage] DB error:', err);
    return null;
  }
}

export default async function PerformancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getPerformanceData(session.user.id);

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto py-16 space-y-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">Performance</h1>
          <p className="text-subtle max-w-md mx-auto">
            Your performance data could not be loaded right now. This is usually a temporary issue.
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow p-6 text-left space-y-4 max-w-md mx-auto">
          <p className="text-sm font-bold text-dark">What you can do:</p>
          <ol className="text-sm text-subtle space-y-2 list-decimal list-inside">
            <li>Refresh the page and try again</li>
            <li>If this keeps happening, contact support</li>
          </ol>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Back to dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (!data.eligible) {
    const logged = data.completedWithResults;
    const needed = Math.max(0, 20 - logged);
    const pct = Math.min(100, Math.round((logged / 20) * 100));

    return (
      <div className="max-w-2xl mx-auto py-16 space-y-6">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BarChart2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-dark mb-2">Performance</h1>
          <p className="text-subtle max-w-md mx-auto">
            Your performance dashboard unlocks after you log results for{' '}
            <strong className="text-dark">20 actions</strong>. That gives Stormo enough data
            to show you meaningful patterns and channel breakdowns.
          </p>
        </div>

        {/* Progress bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-subtle">
            <span>{logged} results logged</span>
            <span>{needed} more to go</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-center text-xs text-subtle">{pct}% complete</p>
        </div>

        {/* Guide card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow p-6 text-left space-y-4 max-w-md mx-auto">
          <p className="text-sm font-bold text-dark">How to unlock this page:</p>
          <ol className="text-sm text-subtle space-y-3 list-decimal list-inside">
            <li>Complete your daily action plan each day</li>
            <li>Open the action in your History tab</li>
            <li>Log your reach, engagement, and sales (takes 30 seconds)</li>
            <li>After 20 logged results, your charts and channel breakdown appear here</li>
          </ol>
          <Link
            href="/dashboard#history"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Go to History to log results
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const { platforms, actionTypes, topActions, funnel, trend } = data;
  const maxSales = Math.max(...platforms.map((p) => p.totalAttributedSales ?? 0), 1);
  const maxTypeSales = Math.max(...actionTypes.map((t) => t.totalAttributedSales ?? 0), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] font-bold text-subtle uppercase tracking-[0.12em] mb-1">Analytics</p>
        <h1 className="text-2xl font-extrabold text-dark">Performance Dashboard</h1>
        <p className="text-sm text-subtle mt-1">Based on {data.completedWithResults} logged action results.</p>
      </div>

      {/* Conversion funnel */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-[3px] bg-primary w-full" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="h-4 w-4 text-primary" />
            <p className="text-sm font-bold text-dark">Conversion Funnel — All Time</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Reach', value: funnel.totalReach.toLocaleString(), icon: Users, color: 'blue' },
              { label: 'Engagement', value: `${funnel.totalEngagement.toLocaleString()} (${funnel.engagementRate})`, icon: BarChart2, color: 'purple' },
              { label: 'Clicks to Store', value: `${funnel.totalClicksToStore.toLocaleString()} (${funnel.clickRate})`, icon: MousePointerClick, color: 'amber' },
              { label: 'Sales Attributed', value: `${funnel.totalSalesAttributed.toLocaleString()} (${funnel.conversionRate})`, icon: ShoppingBag, color: 'green' },
            ].map(({ label, value, icon: Icon, color }) => {
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-50 border-blue-100 text-blue-600',
                purple: 'bg-purple-50 border-purple-100 text-purple-600',
                amber: 'bg-amber-50 border-amber-100 text-amber-600',
                green: 'bg-green-50 border-green-100 text-green-600',
              };
              return (
                <div key={label} className="space-y-2">
                  <div className={`h-8 w-8 rounded-lg border flex items-center justify-center ${colorMap[color]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-subtle">{label}</p>
                  <p className="text-sm font-bold text-dark">{value}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 30-day trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-[3px] bg-violet-500 w-full" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-bold text-dark">30-Day Trend</p>
            <span className="text-xs text-subtle ml-1">vs. prior 30 days</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Reach', now: trend.thisMonth.reach, prev: trend.lastMonth.reach, change: trend.reachChange },
              { label: 'Engagement', now: trend.thisMonth.engagement, prev: trend.lastMonth.engagement, change: trend.engagementChange },
              { label: 'Sales', now: trend.thisMonth.sales, prev: trend.lastMonth.sales, change: trend.salesChange },
            ].map(({ label, now, prev, change }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs font-semibold text-subtle">{label}</p>
                <p className="text-xl font-extrabold text-dark">{now.toLocaleString()}</p>
                <div className="flex items-center gap-1.5">
                  <TrendBadge value={change} />
                  <span className="text-[11px] text-subtle">prev: {prev.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Platform breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px] bg-orange-400 w-full" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-dark">Platform Breakdown</p>
            </div>
            <div className="space-y-3">
              {platforms.length === 0 ? (
                <p className="text-sm text-subtle">No platform data yet — run the nightly aggregation cron.</p>
              ) : (
                platforms.map((row) => (
                  <div key={row.platform} className="space-y-1">
                    <BarRow
                      label={row.platform ?? 'unknown'}
                      value={row.totalAttributedSales ?? 0}
                      max={maxSales}
                      sub="sales"
                    />
                    <div className="flex gap-4 pl-[7.5rem] text-[10px] text-subtle">
                      <span>{row.avgEngagementRate} eng.</span>
                      <span>{row.avgConversionRate} conv.</span>
                      <span>{row.actionCount} actions</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Action type breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-[3px] bg-emerald-500 w-full" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-bold text-dark">Action Type Comparison</p>
            </div>
            <div className="space-y-3">
              {actionTypes.length === 0 ? (
                <p className="text-sm text-subtle">No action type data yet.</p>
              ) : (
                actionTypes.map((row) => (
                  <div key={row.actionType} className="space-y-1">
                    <BarRow
                      label={(row.actionType ?? 'general').replace('_', ' ')}
                      value={row.totalAttributedSales ?? 0}
                      max={maxTypeSales}
                      sub="sales"
                    />
                    <div className="flex gap-4 pl-[7.5rem] text-[10px] text-subtle">
                      <span>{row.avgEngagementRate} eng.</span>
                      <span>{row.avgConversionRate} conv.</span>
                      <span>{row.actionCount} actions</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-[3px] bg-amber-400 w-full" />
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-bold text-dark">Top 5 Actions by Sales</p>
          </div>
          {topActions.length === 0 ? (
            <p className="text-sm text-subtle">No actions with sales data yet.</p>
          ) : (
            <div className="space-y-2">
              {topActions.map((action, i) => (
                <div key={action.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="h-6 w-6 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark truncate">{action.title ?? 'Untitled'}</p>
                    <p className="text-xs text-subtle capitalize">
                      {action.channel ?? '—'} · {(action.actionType ?? 'general').replace('_', ' ')}
                      {action.scheduledFor ? ` · ${action.scheduledFor}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-4 flex-shrink-0 text-right">
                    <div>
                      <p className="text-xs text-subtle">Reach</p>
                      <p className="text-sm font-bold text-dark">{(action.reach ?? 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-subtle">Sales</p>
                      <p className="text-sm font-bold text-green-700">{action.salesAttributed ?? 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
