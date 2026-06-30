import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Simple IANA timezone validation — Intl will throw for invalid zones
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { timezone } = body as { timezone?: string };

    if (!timezone || typeof timezone !== 'string' || !isValidTimezone(timezone)) {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 });
    }

    await db
      .update(users)
      .set({ timezone, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true, timezone });
  } catch (error: any) {
    console.error('[PATCH /api/users/timezone]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
