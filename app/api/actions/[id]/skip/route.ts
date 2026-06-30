import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { actions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const [updatedAction] = await db
      .update(actions)
      .set({ status: 'skipped' })
      .where(and(eq(actions.id, id), eq(actions.userId, userId)))
      .returning();

    if (!updatedAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    return NextResponse.json(updatedAction);
  } catch (error: any) {
    console.error('[Skip Action Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to skip action' },
      { status: 500 }
    );
  }
}
