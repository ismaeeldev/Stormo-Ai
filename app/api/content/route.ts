import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weeklyContent } from '@/lib/db/schema';
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
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const currentWeekStart = getMondayOfCurrentWeek();

    // Fetch this week's content
    const thisWeek = await db
      .select()
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, userId),
          eq(weeklyContent.weekStart, currentWeekStart)
        )
      );

    // Fetch previous weeks' content
    const pastContent = await db
      .select()
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, userId),
          ne(weeklyContent.weekStart, currentWeekStart)
        )
      );

    // Group past content by weekStart
    const pastGroupsMap: Record<string, typeof pastContent> = {};
    pastContent.forEach((item) => {
      const week = item.weekStart || 'Unknown';
      if (!pastGroupsMap[week]) {
        pastGroupsMap[week] = [];
      }
      pastGroupsMap[week].push(item);
    });

    const previousWeeks = Object.keys(pastGroupsMap)
      .sort((a, b) => b.localeCompare(a)) // Sort newest first
      .map((week) => ({
        weekStart: week,
        items: pastGroupsMap[week],
      }));

    return NextResponse.json({
      currentWeek: thisWeek,
      previousWeeks,
    });
  } catch (err: any) {
    console.error('[Content Get API] Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
