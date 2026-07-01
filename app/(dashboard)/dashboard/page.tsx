import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { actions, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Flame, Calendar, ShoppingBag } from 'lucide-react';
import type { Metadata } from 'next';

import DailyActionCard from '@/components/dashboard/DailyActionCard';
import ActionHistoryList from '@/components/dashboard/ActionHistoryList';
import MilestoneConfetti from '@/components/dashboard/MilestoneConfetti';
import SalesCounter from '@/components/dashboard/SalesCounter';
import ProgressTracker from '@/components/dashboard/ProgressTracker';
import ActionContextPanel from '@/components/dashboard/ActionContextPanel';
import DashboardBanner from '@/components/dashboard/DashboardBanner';
import NotificationPermissionBanner from '@/components/dashboard/NotificationPermissionBanner';
import WeeklySummaryCard from '@/components/dashboard/WeeklySummaryCard';
import InsightCard from '@/components/dashboard/InsightCard';

export const metadata: Metadata = {
  title: "Today's Action | Stormo.io",
  description: 'Complete your daily marketing action and scale your store growth.',
};

function calculateStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;
  const unique = Array.from(
    new Set(completedDates.filter(Boolean).map((d) => d.toISOString().split('T')[0]))
  ).sort((a, b) => b.localeCompare(a));
  if (unique.length === 0) return 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  if (unique[0] !== today && unique[0] !== yesterday) return 0;
  let streak = 0;
  const cur = new Date(unique[0]);
  for (let i = 0; i < unique.length; i++) {
    if (unique[i] === cur.toISOString().split('T')[0]) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const name = session.user.name?.split(' ')[0] || 'Founder';

  const [completedActions, userStats] = await Promise.all([
    db.select({ completedAt: actions.completedAt })
      .from(actions)
      .where(and(eq(actions.userId, userId), eq(actions.status, 'completed')))
      .orderBy(desc(actions.completedAt)),
    db.select({ totalSales: users.totalSales, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);

  const userRecord = userStats[0];
  const streak = calculateStreak(
    completedActions.map((a) => a.completedAt).filter((d): d is Date => d !== null)
  );
  const totalSales = userRecord?.totalSales ?? 0;
  const daysAsMember = userRecord?.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(userRecord.createdAt).getTime()) / 86_400_000))
    : 1;
  const plan = ((session.user as any).subscriptionTier ?? 'starter') as string;

  const now = new Date();
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateLabel = `${DAYS[now.getDay()]}, ${MONS[now.getMonth()]} ${now.getDate()}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <MilestoneConfetti />

      {/* ── Welcome header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold text-subtle uppercase tracking-[0.12em] mb-1.5">
            {dateLabel}
          </p>
          <h1 className="text-2xl sm:text-[1.75rem] font-extrabold text-dark tracking-tight leading-none">
            Welcome back, <span className="text-primary">{name}</span>
          </h1>
          <p className="text-sm text-subtle mt-1.5">Your personalised marketing plan is ready.</p>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:pt-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-tint border border-orange-200 text-primary text-[11px] font-bold rounded-lg capitalize">
            <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
            {plan} Plan
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-subtle text-[11px] font-semibold rounded-lg">
            <Calendar className="h-3 w-3" />
            {daysAsMember}d active
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-subtle text-[11px] font-semibold rounded-lg">
            <ShoppingBag className="h-3 w-3" />
            {totalSales} sales
          </span>
          {streak > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-tint border border-orange-200 text-primary text-[11px] font-bold rounded-lg">
              <Flame className="h-3 w-3" />
              {streak}d streak
            </span>
          )}
        </div>
      </div>

      {/* ── Notification permission request (first visit after onboarding) ── */}
      <NotificationPermissionBanner />

      {/* ── Weekly summary card (Mon–Wed only, dismissible) ─────────────── */}
      <WeeklySummaryCard />

      {/* ── AI insight card (latest unread insight) ──────────────────────── */}
      <InsightCard />

      {/* ── Context-aware banner ────────────────────────────────────────── */}
      <DashboardBanner />

      {/* ── Progress cards ──────────────────────────────────────────────── */}
      <ProgressTracker />

      {/* ── Action Plan (70%) + Sales Tracker (30%) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_3fr] gap-5 items-start">
        <DailyActionCard />
        <div className="flex flex-col gap-5">
          <SalesCounter />
          <ActionContextPanel />
        </div>
      </div>

      {/* ── Action History ──────────────────────────────────────────────── */}
      <div id="history">
        <ActionHistoryList />
      </div>
    </div>
  );
}
