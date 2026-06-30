import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserById } from '@/lib/db/queries';
import { triggerCancellationScheduled } from '@/lib/email/triggers';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await getUserById(userId);

    if (!user?.subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const stripeSub = await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    }) as any;

    const periodEnd: number = stripeSub.current_period_end;
    const accessUntil = new Date(periodEnd * 1000);

    await db
      .update(subscriptions)
      .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
      .where(eq(subscriptions.stripeSubscriptionId, user.subscriptionId));

    // Fire immediate cancellation confirmation (non-blocking)
    if (user.email) {
      triggerCancellationScheduled(
        user.email,
        user.name ?? 'Founder',
        accessUntil.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      ).catch((e) => console.error('[billing/cancel] confirmation email failed:', e));
    }

    return NextResponse.json({
      success: true,
      accessUntil: accessUntil.toISOString(),
    });
  } catch (error: any) {
    console.error('[billing/cancel]', error);
    return NextResponse.json({ error: error.message || 'Cancellation failed' }, { status: 500 });
  }
}
