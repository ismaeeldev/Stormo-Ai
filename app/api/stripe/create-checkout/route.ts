import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe/client';
import { getUserById, updateUserSubscription } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    // 1. Get userId from session (require auth)
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch full user record to check for stripeCustomerId
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // 2. If user has no stripe_customer_id: create Stripe customer, save to users table
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      stripeCustomerId = customer.id;
      await updateUserSubscription(userId, { stripeCustomerId });
    }

    // Get pricing variables from env based on selected plan
    let plan = 'starter';
    try {
      const body = await request.json();
      if (body && body.plan) {
        plan = body.plan;
      }
    } catch (e) {
      // Body might be empty or invalid JSON, default to starter
    }

    let priceId = plan === 'growth' ? process.env.STRIPE_PRICE_GROWTH : process.env.STRIPE_PRICE_STARTER_INTRO;

    if (!priceId) {
      return NextResponse.json(
        { error: `Stripe price ID for ${plan} is not configured` },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // 3. Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: stripeCustomerId,
      client_reference_id: userId,
      line_items: [
        {
          price: priceId.trim(),
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout-success`,
      cancel_url: `${appUrl}/pricing`,
      metadata: {
        userId,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
