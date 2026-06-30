import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTodaysAction } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { actions } from '@/lib/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0];

    // 1. Check if today's work is already done — return the completed action so
    //    the client can show "All caught up" without triggering a generate call.
    const [completedToday] = await db
      .select()
      .from(actions)
      .where(
        and(
          eq(actions.userId, userId),
          eq(actions.scheduledFor, today),
          eq(actions.status, 'completed')
        )
      )
      .limit(1);

    if (completedToday) return NextResponse.json(completedToday);

    // 2. Look for an active (scheduled/pending) action for today or the nearest future date
    let action = await getTodaysAction(userId);

    if (!action) {
      const [earliest] = await db
        .select()
        .from(actions)
        .where(
          and(
            eq(actions.userId, userId),
            inArray(actions.status, ['scheduled', 'pending'])
          )
        )
        .orderBy(asc(actions.scheduledFor))
        .limit(1);

      if (earliest) action = earliest;
    }

    return NextResponse.json(action);
  } catch (error: any) {
    console.error('[Get Today Action Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch today\'s action' },
      { status: 500 }
    );
  }
}
