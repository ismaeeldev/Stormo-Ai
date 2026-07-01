import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { actions } from '@/lib/db/schema';
import { eq, and, ne, or, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Get filters & pagination params
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const todayStr = new Date().toISOString().split('T')[0];

    // Build query conditions
    const conditions = [
      eq(actions.userId, userId),
      // Hide today's pending action — but show it once completed or skipped
      or(ne(actions.scheduledFor, todayStr), eq(actions.status, 'completed'), eq(actions.status, 'skipped'))!,
      ne(actions.status, 'scheduled'),       // Exclude future scheduled actions
    ];

    if (status && status !== 'all') {
      conditions.push(eq(actions.status, status));
    }

    if (channel && channel !== 'all') {
      conditions.push(eq(actions.channel, channel));
    }

    // Query database
    const historyActions = await db
      .select({
        id: actions.id,
        title: actions.title,
        channel: actions.channel,
        actionType: actions.actionType,
        status: actions.status,
        outcomeSignal: actions.outcomeSignal,
        scheduledFor: actions.scheduledFor,
        completedAt: actions.completedAt,
        createdAt: actions.createdAt,
      })
      .from(actions)
      .where(and(...conditions))
      .orderBy(desc(actions.scheduledFor), desc(actions.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(historyActions);
  } catch (error: any) {
    console.error('[Get History Route] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch action history' },
      { status: 500 }
    );
  }
}
