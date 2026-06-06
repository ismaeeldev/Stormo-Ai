import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { milestones, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user details
    const [user] = await db
      .select({
        totalSales: users.totalSales,
        subscriptionTier: users.subscriptionTier,
      })
      .from(users)
      .where(eq(users.id, userId));

    // Fetch achieved milestones
    const userMilestones = await db
      .select({
        milestoneKey: milestones.milestoneKey,
        achievedAt: milestones.achievedAt,
      })
      .from(milestones)
      .where(eq(milestones.userId, userId));

    return NextResponse.json({
      totalSales: user.totalSales || 0,
      subscriptionTier: user.subscriptionTier || 'free',
      achievedMilestones: userMilestones,
    });
  } catch (error: any) {
    console.error('[Milestones API] Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
