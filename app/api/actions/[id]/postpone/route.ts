import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { actions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Calculate tomorrow's date string (YYYY-MM-DD)
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // Move to tomorrow and mark as postponed
    const [updatedAction] = await db
      .update(actions)
      .set({
        scheduledFor: tomorrowStr,
        status: 'postponed',
      })
      .where(and(eq(actions.id, id), eq(actions.userId, userId)))
      .returning();

    if (!updatedAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json(updatedAction);
  } catch (error: any) {
    console.error('[Postpone Action Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to postpone action' },
      { status: 500 }
    );
  }
}
