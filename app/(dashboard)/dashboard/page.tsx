import React from 'react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { actions, weeklyContent, outreachContacts } from '@/lib/db/schema';
import { eq, and, gte, desc, count } from 'drizzle-orm';
import { Zap, FileText, Users, Trophy, Loader2 } from 'lucide-react';

// Streak Calculation Helper
function calculateStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;

  // Convert to local date strings (YYYY-MM-DD) and remove duplicates
  const uniqueDates = Array.from(
    new Set(completedDates.filter(Boolean).map((d) => d.toISOString().split('T')[0]))
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // If the latest completion isn't today or yesterday, streak is broken (0)
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(uniqueDates[0]);

  for (let i = 0; i < uniqueDates.length; i++) {
    const expectedDateStr = currentDate.toISOString().split('T')[0];
    if (uniqueDates[i] === expectedDateStr) {
      streak++;
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

import DailyActionCard from '@/components/dashboard/DailyActionCard';
import ActionHistoryList from '@/components/dashboard/ActionHistoryList';
import MilestoneConfetti from '@/components/dashboard/MilestoneConfetti';

export default async function DashboardPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  // 1. Fetch counts for the Quick Stats Row
  const [completedActionsResult] = await db
    .select({ value: count() })
    .from(actions)
    .where(and(eq(actions.userId, userId), eq(actions.status, 'completed')));
  const completedActionsCount = completedActionsResult?.value || 0;

  const [contentResult] = await db
    .select({ value: count() })
    .from(weeklyContent)
    .where(eq(weeklyContent.userId, userId));
  const contentCount = contentResult?.value || 0;

  const [outreachResult] = await db
    .select({ value: count() })
    .from(outreachContacts)
    .where(eq(outreachContacts.userId, userId));
  const outreachCount = outreachResult?.value || 0;

  // 2. Fetch completed actions to calculate streak
  const completedActions = await db
    .select({ completedAt: actions.completedAt })
    .from(actions)
    .where(and(eq(actions.userId, userId), eq(actions.status, 'completed')))
    .orderBy(desc(actions.completedAt));

  const completedDates = completedActions
    .map((a) => a.completedAt)
    .filter((date): date is Date => date !== null);
  
  const streak = calculateStreak(completedDates);

  // 3. Progress indicator: actions completed this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [actionsThisMonthResult] = await db
    .select({ value: count() })
    .from(actions)
    .where(
      and(
        eq(actions.userId, userId),
        eq(actions.status, 'completed'),
        gte(actions.completedAt, startOfMonth)
      )
    );
  const actionsThisMonthCount = actionsThisMonthResult?.value || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <MilestoneConfetti />
      {/* Welcome & Streak Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">
            Welcome back, {session.user.name || 'Founder'}!
          </h1>
          <p className="text-subtle text-sm mt-1">Here is your automated marketing schedule for today.</p>
        </div>
        <div className="flex items-center gap-3 bg-white shadow-md rounded-xl p-4 border border-gray-100">
          <Trophy className="h-6 w-6 text-primary" />
          <div>
            <p className="text-xs font-semibold text-subtle uppercase">Streak Counter</p>
            <p className="text-sm font-bold text-dark mt-0.5">
              {streak}-day streak! Keep it up.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Stat 1: Actions Completed */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-3 border-primary flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-subtle uppercase tracking-wider">Actions Completed</p>
            <p className="text-3xl font-black text-primary mt-2">{completedActionsCount}</p>
          </div>
          <Zap className="h-10 w-10 text-primary/10 fill-primary/5" />
        </div>

        {/* Stat 2: Content Pieces */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-3 border-primary flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-subtle uppercase tracking-wider">Content Pieces</p>
            <p className="text-3xl font-black text-primary mt-2">{contentCount}</p>
          </div>
          <FileText className="h-10 w-10 text-primary/10 fill-primary/5" />
        </div>

        {/* Stat 3: Outreach Contacts */}
        <div className="bg-white rounded-xl shadow-md p-6 border-t-3 border-primary flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-subtle uppercase tracking-wider">Outreach Contacts</p>
            <p className="text-3xl font-black text-primary mt-2">{outreachCount}</p>
          </div>
          <Users className="h-10 w-10 text-primary/10 fill-primary/5" />
        </div>
      </div>

      {/* Monthly Progress Bar */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-bold text-dark text-sm">Monthly Action Goal</h3>
          <span className="text-xs font-semibold text-primary">
            Action {actionsThisMonthCount} of 30 this month
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min((actionsThisMonthCount / 30) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Today's Action Card */}
      <DailyActionCard />

      {/* Action History Section */}
      <ActionHistoryList />
    </div>
  );
}
