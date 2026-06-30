import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserById, updateUserSubscription } from '@/lib/db/queries';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.growthUnlocked) {
      return NextResponse.json(
        { error: 'Growth plan is not yet unlocked. Reach 10 sales to unlock it.' },
        { status: 403 }
      );
    }

    if (user.subscriptionTier === 'growth') {
      return NextResponse.json({ error: 'Already on Growth plan' }, { status: 400 });
    }

    const growthPriceId = process.env.STRIPE_PRICE_GROWTH?.trim();
    if (!growthPriceId) {
      return NextResponse.json({ error: 'Growth price not configured' }, { status: 500 });
    }

    // ── Path A: user has an active subscription → update price inline ──────────
    if (user.subscriptionId) {
      const stripeSub = await stripe.subscriptions.retrieve(user.subscriptionId);
      const itemId = stripeSub.items.data[0]?.id;

      if (!itemId) {
        return NextResponse.json({ error: 'Subscription item not found' }, { status: 400 });
      }

      await stripe.subscriptions.update(user.subscriptionId, {
        items: [{ id: itemId, price: growthPriceId }],
        proration_behavior: 'create_prorations',
      });

      await db
        .update(users)
        .set({ subscriptionTier: 'growth', updatedAt: new Date() })
        .where(eq(users.id, userId));

      await db
        .update(subscriptions)
        .set({ stripePriceId: growthPriceId, updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, user.subscriptionId));

      return NextResponse.json({ success: true, tier: 'growth' });
    }

    // ── Path B: no subscription → create Stripe Checkout session ───────────────
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      await updateUserSubscription(userId, { stripeCustomerId });
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      client_reference_id: userId,
      line_items: [{ price: growthPriceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard/settings?upgraded=true`,
      cancel_url: `${appUrl}/dashboard/settings`,
      metadata: { userId },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('[billing/upgrade]', error);
    return NextResponse.json({ error: error.message || 'Upgrade failed' }, { status: 500 });
  }
}
