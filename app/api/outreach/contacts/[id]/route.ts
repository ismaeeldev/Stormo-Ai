import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { outreachContacts } from '@/lib/db/schema';
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
    const body = await request.json();

    const allowedUpdates: Record<string, any> = {};
    const fields = ['status', 'followUpDue', 'notes', 'lastContactAt', 'name', 'platform', 'profileUrl', 'followerCount', 'nicheMatch'];

    fields.forEach((field) => {
      if (body[field] !== undefined) {
        allowedUpdates[field] = body[field];
      }
    });

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
    }

    const [updatedContact] = await db
      .update(outreachContacts)
      .set(allowedUpdates)
      .where(
        and(
          eq(outreachContacts.id, id),
          eq(outreachContacts.userId, userId)
        )
      )
      .returning();

    if (!updatedContact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    return NextResponse.json(updatedContact);
  } catch (err: any) {
    console.error('[Outreach PATCH API] Error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
