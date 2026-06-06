import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserById } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await getUserById(userId);

    if (!user || !user.subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Set cancel_at_period_end = true in Stripe
    const stripeSubscription = await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update subscriptions table in DB
    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, user.subscriptionId));

    // Optional: Sync user status or rely on webhook.
    // Setting cancelAtPeriodEnd in database here ensures immediate UI feedback.
    
    const cancelAtTimestamp = (stripeSubscription as any).current_period_end || (stripeSubscription as any).currentPeriodEnd;
    const cancelAt = cancelAtTimestamp ? new Date(cancelAtTimestamp * 1000).toISOString() : new Date().toISOString();
    
    return NextResponse.json({
      message: 'Subscription cancel scheduled successfully',
      cancelAt,
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
