import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe/client';
import { getUserById } from '@/lib/db/queries';

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

    if (user.subscriptionTier !== 'growth') {
      return NextResponse.json({ error: 'Not on Growth plan' }, { status: 400 });
    }

    if (!user.subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const starterPriceId = process.env.STRIPE_PRICE_STARTER?.trim();
    const growthPriceId = process.env.STRIPE_PRICE_GROWTH?.trim();

    if (!starterPriceId || !growthPriceId) {
      return NextResponse.json({ error: 'Price IDs not configured' }, { status: 500 });
    }

    // Retrieve subscription with schedule expanded to detect existing schedules
    const sub = await stripe.subscriptions.retrieve(user.subscriptionId, {
      expand: ['schedule'],
    }) as any;

    const periodEnd: number = sub.current_period_end;
    const effectiveDate = new Date(periodEnd * 1000);

    // Use subscription schedule so the tier change only fires at period end
    // (prevents the subscription.updated webhook from downgrading the user early)
    if (sub.schedule) {
      // Existing schedule (e.g. intro→regular) — update its phases
      await stripe.subscriptionSchedules.update(sub.schedule.id || sub.schedule, {
        end_behavior: 'release',
        phases: [
          { items: [{ price: growthPriceId }], end_date: periodEnd },
          { items: [{ price: starterPriceId }] },
        ],
      });
    } else {
      // No existing schedule — create one anchored to period end
      await stripe.subscriptionSchedules.create({
        from_subscription: user.subscriptionId,
        end_behavior: 'release',
        phases: [
          { items: [{ price: growthPriceId }], end_date: periodEnd },
          { items: [{ price: starterPriceId }] },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      effectiveDate: effectiveDate.toISOString(),
    });
  } catch (error: any) {
    console.error('[billing/downgrade]', error);
    return NextResponse.json({ error: error.message || 'Downgrade failed' }, { status: 500 });
  }
}
