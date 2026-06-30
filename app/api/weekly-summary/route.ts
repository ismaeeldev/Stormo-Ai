import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weeklyContent } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Card only shows Monday–Wednesday (days 1–3)
    const dayOfWeek = new Date().getUTCDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed
    if (dayOfWeek === 0 || dayOfWeek > 3) {
      return NextResponse.json({ summary: null });
    }

    // Get the most recent weekly summary for this user
    const [row] = await db
      .select({
        weekStart: weeklyContent.weekStart,
        title: weeklyContent.title,
        content: weeklyContent.content,
      })
      .from(weeklyContent)
      .where(
        and(
          eq(weeklyContent.userId, session.user.id),
          eq(weeklyContent.contentType, 'weekly_summary'),
          eq(weeklyContent.status, 'ready')
        )
      )
      .orderBy(desc(weeklyContent.createdAt))
      .limit(1);

    if (!row?.content) {
      return NextResponse.json({ summary: null });
    }

    // Only show if it's from the current week (weekStart = this Monday)
    const now = new Date();
    const thisMonday = new Date(now);
    thisMonday.setUTCDate(now.getUTCDate() - (now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1));
    thisMonday.setUTCHours(0, 0, 0, 0);
    const thisMondayStr = thisMonday.toISOString().split('T')[0];

    if (row.weekStart !== thisMondayStr) {
      return NextResponse.json({ summary: null });
    }

    return NextResponse.json({
      summary: {
        weekStart: row.weekStart,
        title: row.title,
        ...JSON.parse(row.content ?? '{}'),
      },
    });
  } catch (err: any) {
    console.error('[GET /api/weekly-summary]', err);
    return NextResponse.json({ summary: null });
  }
}
