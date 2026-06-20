import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/auth';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: 'Coupon code required' }, { status: 400 });

  const [coupon] = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code.toUpperCase().trim()))
    .limit(1);

  if (!coupon || !coupon.isActive) {
    return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
  }

  // Check user's current plan matches coupon plan type
  const [currentUser] = await db
    .select({ subscriptionTier: users.subscriptionTier, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (currentUser?.subscriptionTier === 'starter' || currentUser?.subscriptionTier === 'growth') {
    return NextResponse.json({ error: 'You already have an active subscription' }, { status: 400 });
  }

  // Atomic increment — only succeeds if capacity remains
  const [claimed] = await db
    .update(coupons)
    .set({ usedCount: sql`${coupons.usedCount} + 1`, updatedAt: new Date() })
    .where(eq(coupons.id, coupon.id))
    .returning({ usedCount: coupons.usedCount, maxRedemptions: coupons.maxRedemptions });

  // usedCount after increment — if it exceeds max, it was already full
  if (!claimed || claimed.usedCount > claimed.maxRedemptions) {
    // Roll back the increment
    await db
      .update(coupons)
      .set({ usedCount: sql`${coupons.usedCount} - 1` })
      .where(eq(coupons.id, coupon.id));
    return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
  }

  // Grant plan access
  await db
    .update(users)
    .set({
      subscriptionTier: coupon.planType,
      subscriptionStatus: 'active',
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true, planType: coupon.planType });
}
