import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminUsers } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

// Developer-only endpoint to create admin accounts.
// Requires ADMIN_SETUP_SECRET in env — never expose this to users.
export async function POST(request: Request) {
  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  if (!setupSecret) {
    return NextResponse.json({ error: 'ADMIN_SETUP_SECRET not configured' }, { status: 500 });
  }

  const { secret, username, password } = await request.json();

  if (secret !== setupSecret) {
    return NextResponse.json({ error: 'Invalid setup secret' }, { status: 403 });
  }

  if (!username || !password || password.length < 8) {
    return NextResponse.json({ error: 'Username required and password must be 8+ chars' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [admin] = await db
    .insert(adminUsers)
    .values({ username, passwordHash })
    .returning({ id: adminUsers.id, username: adminUsers.username });

  return NextResponse.json({ ok: true, admin });
}
