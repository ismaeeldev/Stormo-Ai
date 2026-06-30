import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { actions, actionResults } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Verify ownership
    const [action] = await db
      .select({ id: actions.id })
      .from(actions)
      .where(and(eq(actions.id, id), eq(actions.userId, userId)));

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const [results] = await db
      .select()
      .from(actionResults)
      .where(and(eq(actionResults.actionId, id), eq(actionResults.userId, userId)));

    return NextResponse.json({ results: results ?? null });
  } catch (error: any) {
    console.error('[GET /api/actions/[id]/results]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Verify ownership
    const [action] = await db
      .select({ id: actions.id, channel: actions.channel, actionType: actions.actionType })
      .from(actions)
      .where(and(eq(actions.id, id), eq(actions.userId, userId)));

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { reach, engagement, followersGained, salesAttributed, clicksToStore, emailListAdditions, notes } = body as {
      reach?: number;
      engagement?: number;
      followersGained?: number;
      salesAttributed?: number;
      clicksToStore?: number;
      emailListAdditions?: number;
      notes?: string;
    };

    const now = new Date();

    const [saved] = await db
      .insert(actionResults)
      .values({
        actionId: id,
        userId,
        reach: reach ?? null,
        engagement: engagement ?? null,
        followersGained: followersGained ?? null,
        salesAttributed: salesAttributed ?? 0,
        clicksToStore: clicksToStore ?? 0,
        emailListAdditions: emailListAdditions ?? 0,
        platform: action.channel ?? null,
        actionType: action.actionType ?? null,
        notes: notes ?? null,
        loggedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: actionResults.actionId,
        set: {
          reach: reach ?? null,
          engagement: engagement ?? null,
          followersGained: followersGained ?? null,
          salesAttributed: salesAttributed ?? 0,
          clicksToStore: clicksToStore ?? 0,
          emailListAdditions: emailListAdditions ?? 0,
          platform: action.channel ?? null,
          actionType: action.actionType ?? null,
          notes: notes ?? null,
          updatedAt: now,
        },
      })
      .returning();

    return NextResponse.json({ success: true, results: saved });
  } catch (error: any) {
    console.error('[POST /api/actions/[id]/results]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
