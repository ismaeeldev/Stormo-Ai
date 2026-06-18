import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weeklyContent, users } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';

function getMondayOfCurrentWeek() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const currentWeekStart = getMondayOfCurrentWeek();

    const thisWeek = await db
      .select()
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, userId),
          eq(weeklyContent.weekStart, currentWeekStart)
        )
      );

    let onboardingCompleted = false;
    const [userRow] = await db
      .select({ onboardingCompleted: users.onboardingCompleted })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRow) {
      onboardingCompleted = !!userRow.onboardingCompleted;
    }

    const pastContent = await db
      .select()
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, userId),
          ne(weeklyContent.weekStart, currentWeekStart)
        )
      );

    const pastGroupsMap: Record<string, typeof pastContent> = {};
    pastContent.forEach((item) => {
      const week = item.weekStart || 'Unknown';
      if (!pastGroupsMap[week]) pastGroupsMap[week] = [];
      pastGroupsMap[week].push(item);
    });

    const previousWeeks = Object.keys(pastGroupsMap)
      .sort((a, b) => b.localeCompare(a))
      .map((week) => ({ weekStart: week, items: pastGroupsMap[week] }));

    return NextResponse.json({
      currentWeek: thisWeek,
      previousWeeks,
      onboardingCompleted,
      currentWeekStart,
    });
  } catch (err: any) {
    console.error('[Content API] Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
