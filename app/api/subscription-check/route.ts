import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier, subscriptionStatus: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  return NextResponse.json({
    subscriptionTier: user?.subscriptionTier ?? 'free',
    subscriptionStatus: user?.subscriptionStatus ?? 'inactive',
    active: user?.subscriptionTier === 'starter' || user?.subscriptionTier === 'growth',
  });
}
