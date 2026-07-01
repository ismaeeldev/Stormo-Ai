import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { actions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateCoverageMap } from '@/lib/db/queries';
import { checkAndAwardMilestones } from '@/lib/milestones/check-milestones';

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
    const body = await request.json().catch(() => ({}));
    const outcomeSignal: string | null = body.outcomeSignal ?? null;

    // Fetch the action first to verify ownership and get channel
    const [action] = await db
      .select()
      .from(actions)
      .where(and(eq(actions.id, id), eq(actions.userId, userId)));

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    // Update action record
    const [updatedAction] = await db
      .update(actions)
      .set({
        status: 'completed',
        outcomeSignal,
        completedAt: new Date(),
      })
      .where(eq(actions.id, id))
      .returning();

    // Update user's channel coverage map in DB
    if (action.channel) {
      await updateCoverageMap(userId, action.channel, outcomeSignal ?? '');
    }

    // Check and award milestones
    await checkAndAwardMilestones(userId, 'action_completed');

    return NextResponse.json(updatedAction);
  } catch (error: any) {
    console.error('[Complete Action Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete action' },
      { status: 500 }
    );
  }
}
