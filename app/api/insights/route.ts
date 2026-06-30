import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { insights } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [row] = await db
      .select()
      .from(insights)
      .where(
        and(
          eq(insights.userId, session.user.id),
          eq(insights.isRead, false)
        )
      )
      .orderBy(desc(insights.generatedAt))
      .limit(1);

    return NextResponse.json({ insight: row ?? null });
  } catch (err: any) {
    console.error('[GET /api/insights]', err);
    return NextResponse.json({ insight: null });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json() as { id: string };
    if (!id) {
      return NextResponse.json({ error: 'Missing insight id' }, { status: 400 });
    }

    await db
      .update(insights)
      .set({ isRead: true })
      .where(
        and(
          eq(insights.id, id),
          eq(insights.userId, session.user.id)
        )
      );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[PATCH /api/insights]', err);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
