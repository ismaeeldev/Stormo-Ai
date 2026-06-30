import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { actions, users, actionResults } from '@/lib/db/schema';
import { eq, and, desc, count, lt, isNull } from 'drizzle-orm';

function calculateStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0;

  const uniqueDates = Array.from(
    new Set(completedDates.filter(Boolean).map((d) => d.toISOString().split('T')[0]))
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Streak is broken if the most recent completion is older than yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 0;
  const cursor = new Date(uniqueDates[0]);

  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = cursor.toISOString().split('T')[0];
    if (uniqueDates[i] === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Run independent queries in parallel for speed
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const [
      completedResult,
      completedDatesRows,
      userRow,
      channelRows,
      unloggedRows,
    ] = await Promise.all([
      // 1. totalActionsCompleted
      db
        .select({ value: count() })
        .from(actions)
        .where(and(eq(actions.userId, userId), eq(actions.status, 'completed')))
        .then(([r]) => r),

      // 2. All completed dates for streak
      db
        .select({ completedAt: actions.completedAt })
        .from(actions)
        .where(and(eq(actions.userId, userId), eq(actions.status, 'completed')))
        .orderBy(desc(actions.completedAt)),

      // 3. User row: totalSales + createdAt + banner fields
      db
        .select({
          totalSales: users.totalSales,
          createdAt: users.createdAt,
          growthUnlocked: users.growthUnlocked,
          subscriptionTier: users.subscriptionTier,
          trialEndsAt: users.trialEndsAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .then(([r]) => r),

      // 4. Most used channel among completed actions
      db
        .select({ channel: actions.channel, cnt: count(actions.id) })
        .from(actions)
        .where(and(eq(actions.userId, userId), eq(actions.status, 'completed')))
        .groupBy(actions.channel)
        .orderBy(desc(count(actions.id)))
        .limit(1),

      // 5. Any completed action >48h old with no results logged
      db
        .select({ id: actions.id })
        .from(actions)
        .leftJoin(actionResults, eq(actionResults.actionId, actions.id))
        .where(
          and(
            eq(actions.userId, userId),
            eq(actions.status, 'completed'),
            lt(actions.completedAt, fortyEightHoursAgo),
            isNull(actionResults.actionId)
          )
        )
        .limit(1),
    ]);

    const totalActionsCompleted = Number(completedResult?.value ?? 0);

    const completedDates = completedDatesRows
      .map((r) => r.completedAt)
      .filter((d): d is Date => d !== null && d !== undefined);
    const currentStreak = calculateStreak(completedDates);

    const totalSales = userRow?.totalSales ?? 0;

    const daysAsMember = userRow?.createdAt
      ? Math.max(1, Math.floor((Date.now() - new Date(userRow.createdAt).getTime()) / 86400000) + 1)
      : 1;

    const mostUsedChannel = channelRows[0]?.channel ?? null;
    const hasUnloggedAction = unloggedRows.length > 0;

    return NextResponse.json({
      totalActionsCompleted,
      currentStreak,
      totalSales,
      daysAsMember,
      mostUsedChannel,
      growthUnlocked: userRow?.growthUnlocked ?? false,
      subscriptionTier: userRow?.subscriptionTier ?? 'free',
      trialEndsAt: userRow?.trialEndsAt?.toISOString() ?? null,
      hasUnloggedAction,
    });
  } catch (error: any) {
    console.error('[GET /api/progress]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
