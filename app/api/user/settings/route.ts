import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    return NextResponse.json({
      tier: user?.subscriptionTier || 'free',
      totalSales: user?.totalSales || 0,
      nextBillingDate: sub?.currentPeriodEnd || null,
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd || false,
    });
  } catch (error) {
    console.error('Fetch settings data error:', error);
    return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 });
  }
}
