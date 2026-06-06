import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTodaysAction } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { actions } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let action = await getTodaysAction(userId);

    if (!action) {
      const today = new Date().toISOString().split('T')[0];
      
      // 1. Try to find a scheduled action for today
      const [scheduledToday] = await db
        .select()
        .from(actions)
        .where(
          and(
            eq(actions.userId, userId),
            eq(actions.status, 'scheduled'),
            eq(actions.scheduledFor, today)
          )
        );

      if (scheduledToday) {
        action = scheduledToday;
      } else {
        // 2. Otherwise get the earliest scheduled action
        const [earliestScheduled] = await db
          .select()
          .from(actions)
          .where(
            and(
              eq(actions.userId, userId),
              eq(actions.status, 'scheduled')
            )
          )
          .orderBy(asc(actions.scheduledFor))
          .limit(1);
        
        if (earliestScheduled) {
          action = earliestScheduled;
        }
      }
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
