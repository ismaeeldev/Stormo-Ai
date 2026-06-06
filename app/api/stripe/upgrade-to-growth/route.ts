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

    // Growth Upgrade button (only show when users.total_sales >= 10)
    const totalSales = user.totalSales || 0;
    if (totalSales < 10) {
      return NextResponse.json(
        { error: 'You need at least 10 sales to upgrade to the Growth tier' },
        { status: 400 }
      );
    }

    const growthPriceId = process.env.STRIPE_PRICE_GROWTH;
    if (!growthPriceId) {
      return NextResponse.json(
        { error: 'Stripe Growth price ID is not configured' },
        { status: 500 }
      );
    }

    // Retrieve the active subscription from Stripe to get item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(user.subscriptionId);
    const itemId = stripeSubscription.items.data[0]?.id;

    if (!itemId) {
      return NextResponse.json({ error: 'Subscription item not found' }, { status: 400 });
    }

    // Update price on Stripe
    await stripe.subscriptions.update(user.subscriptionId, {
      items: [
        {
          id: itemId,
          price: growthPriceId.trim(),
        },
      ],
      proration_behavior: 'create_prorations',
    });

    // Update users table in DB
    await db
      .update(users)
      .set({
        subscriptionTier: 'growth',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update subscriptions table in DB
    await db
      .update(subscriptions)
      .set({
        stripePriceId: growthPriceId.trim(),
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, user.subscriptionId));

    return NextResponse.json({
      message: 'Successfully upgraded to Growth plan',
      tier: 'growth',
    });
  } catch (error: any) {
    console.error('Upgrade subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upgrade subscription' },
      { status: 500 }
    );
  }
}
