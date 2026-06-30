import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { BarChart2, TrendingUp, TrendingDown, Users, MousePointerClick, ShoppingBag, Zap, Trophy } from 'lucide-react';
import type { Metadata } from 'next';

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

async function getPerformanceData(origin: string): Promise<PerfData | null> {
  try {
    const res = await fetch(`${origin}/api/performance`, {
      cache: 'no-store',
      headers: await headers(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PerformancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const headersList = await headers();
  const host = headersList.get('host') ?? 'localhost:3000';
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const origin = `${proto}://${host}`;

  const data = await getPerformanceData(origin);

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <BarChart2 className="h-12 w-12 text-subtle mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-dark mb-2">Performance</h1>
        <p className="text-subtle">Could not load performance data. Try again later.</p>
      </div>
    );
  }

  if (!data.eligible) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <BarChart2 className="h-12 w-12 text-primary/40 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-dark mb-2">Performance Dashboard</h1>
        <p className="text-subtle max-w-md mx-auto">
          Complete more actions and log your results to unlock your performance dashboard.
          You've logged results for <strong>{data.completedWithResults}</strong> action{data.completedWithResults !== 1 ? 's' : ''} — you need <strong>{20 - data.completedWithResults}</strong> more.
        </p>
        <div className="mt-6 h-2 bg-gray-100 rounded-full max-w-xs mx-auto overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(100, (data.completedWithResults / 20) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-subtle">{data.completedWithResults} / 20 results logged</p>
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
