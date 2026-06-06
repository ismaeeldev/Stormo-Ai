import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { checkAndAwardMilestones } from '@/lib/milestones/check-milestones';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Increment users.totalSales by 1
    const [updatedUser] = await db
      .update(users)
      .set({
        totalSales: sql`${users.totalSales} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Trigger milestone check for first_sale and ten_sales
    await checkAndAwardMilestones(userId, 'sale_reported');

    return NextResponse.json({
      success: true,
      totalSales: updatedUser.totalSales || 0,
    });
  } catch (error: any) {
    console.error('[Report Sale API] Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
