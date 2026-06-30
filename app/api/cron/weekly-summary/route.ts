import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, actions, actionResults, weeklyContent } from '@/lib/db/schema';
import { eq, and, gte, lt, count, desc } from 'drizzle-orm';
import { triggerWeeklySummary } from '@/lib/email/triggers';

export const maxDuration = 300;

function getLastWeekRange(): { start: Date; end: Date; mondayStr: string } {
  const now = new Date();
  // Start of today (Monday when cron runs)
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // Last Monday = 7 days ago
  const start = new Date(todayStart);
  start.setUTCDate(start.getUTCDate() - 7);

  // Last Sunday = yesterday
  const end = new Date(todayStart);
  end.setUTCMilliseconds(-1); // 23:59:59.999 of yesterday

  // Current Monday as YYYY-MM-DD for storage
  const mondayStr = todayStart.toISOString().split('T')[0];

  return { start, end, mondayStr };
}


export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { start, end, mondayStr } = getLastWeekRange();
  const weekLabel = `Week of ${new Date(start).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  let processed = 0;
  let emailsSent = 0;
  let errors = 0;

  const eligibleUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
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
    if (!user.email) continue;
    processed++;

    try {
      // ── Last week's completed actions ───────────────────────────────────
      const [completedRow] = await db
        .select({ value: count() })
        .from(actions)
        .where(
          and(
            eq(actions.userId, user.id),
            eq(actions.status, 'completed'),
            gte(actions.completedAt, start),
            lt(actions.completedAt, end)
          )
        );
      const actionsCompleted = Number(completedRow?.value ?? 0);

      // ── Top channel used this week ──────────────────────────────────────
      const [topChannel] = await db
        .select({ channel: actions.channel, cnt: count(actions.id) })
        .from(actions)
        .where(
          and(
            eq(actions.userId, user.id),
            eq(actions.status, 'completed'),
            gte(actions.completedAt, start),
            lt(actions.completedAt, end)
          )
        )
        .groupBy(actions.channel)
        .orderBy(desc(count(actions.id)))
        .limit(1);
      const channelFocus = topChannel?.channel ?? null;

      // ── Results logged last week ────────────────────────────────────────
      const [latestResult] = await db
        .select({ notes: actionResults.notes, salesAttributed: actionResults.salesAttributed })
        .from(actionResults)
        .where(
          and(
            eq(actionResults.userId, user.id),
            gte(actionResults.loggedAt, start),
            lt(actionResults.loggedAt, end)
          )
        )
        .orderBy(desc(actionResults.salesAttributed))
        .limit(1);

      const resultsHighlight = latestResult?.notes
        ? latestResult.notes.slice(0, 120)
        : latestResult?.salesAttributed
        ? `${latestResult.salesAttributed} attributed sale${latestResult.salesAttributed === 1 ? '' : 's'}`
        : null;

      // ── Current streak (all-time, not just last week) ───────────────────
      const allCompleted = await db
        .select({ completedAt: actions.completedAt })
        .from(actions)
        .where(and(eq(actions.userId, user.id), eq(actions.status, 'completed')))
        .orderBy(desc(actions.completedAt));

      const dates = Array.from(
        new Set(
          allCompleted
            .map((a) => a.completedAt?.toISOString().split('T')[0])
            .filter(Boolean) as string[]
        )
      ).sort((a, b) => b.localeCompare(a));

      let streak = 0;
      if (dates.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
        if (dates[0] === today || dates[0] === yesterday) {
          const cursor = new Date(dates[0]);
          for (const d of dates) {
            if (d === cursor.toISOString().split('T')[0]) {
              streak++;
              cursor.setDate(cursor.getDate() - 1);
            } else break;
          }
        }
      }

      // ── Store summary in weeklyContent for dashboard card ───────────────
      const summaryPayload = JSON.stringify({
        actionsCompleted,
        resultsHighlight,
        channelFocus,
        streak,
        totalSales: user.totalSales ?? 0,
        growthUnlocked: user.growthUnlocked ?? false,
        weekLabel,
      });

      await db
        .insert(weeklyContent)
        .values({
          userId: user.id,
          weekStart: mondayStr,
          contentType: 'weekly_summary',
          title: weekLabel,
          content: summaryPayload,
          status: 'ready',
        })
        .onConflictDoNothing();

      // ── Send email (branded template) ──────────────────────────────────
      const growthUnlocked = user.growthUnlocked ?? false;
      const totalSales = user.totalSales ?? 0;
      const salesProgressText = growthUnlocked
        ? 'Growth plan unlocked — you are in the top tier.'
        : `${totalSales} sale${totalSales === 1 ? '' : 's'} logged. ${Math.max(0, 10 - totalSales)} more to unlock the Growth plan.`;

      let encouragement: string;
      if (growthUnlocked) encouragement = 'You have unlocked the Growth plan. Keep scaling!';
      else if (streak >= 7) encouragement = `${streak}-day streak — you are building a real habit. This is how stores grow.`;
      else if (streak >= 3) encouragement = `${streak} days in a row. Consistency is your edge.`;
      else if (totalSales >= 5) encouragement = `${totalSales} sales logged — momentum is building. Keep going.`;
      else encouragement = 'Every action compounds. Stay consistent this week.';

      await triggerWeeklySummary(user.email, user.name ?? 'Founder', {
        weekRange: weekLabel,
        actionsCompleted,
        streak,
        totalSales,
        topChannel: channelFocus ?? '—',
        resultsHighlight,
        salesProgressText,
        encouragingMessage: encouragement,
      });

      emailsSent++;
    } catch (err: any) {
      console.error(`[weekly-summary] Failed for user ${user.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({ success: true, processed, emailsSent, errors });
}
