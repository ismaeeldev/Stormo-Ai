import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { users, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import {
  sendSubscriptionActiveEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCanceledEmail,
} from '@/lib/email/send-templates';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        
        // Find user by stripeCustomerId or metadata
        const userId = subscription.metadata.userId;
        let dbUser = null;
        
        if (userId) {
          [dbUser] = await db.select().from(users).where(eq(users.id, userId));
        } else {
          [dbUser] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
        }

        if (!dbUser) {
          console.error(`User not found for customer ID: ${customerId}`);
          break;
        }

        // Determine subscription tier based on price ID
        const priceId = subscription.items.data[0]?.price.id;
        const tier = priceId === process.env.STRIPE_PRICE_GROWTH ? 'growth' : 'starter';

        // Update users table
        await db
          .update(users)
          .set({
            subscriptionTier: tier,
            subscriptionStatus: 'active',
            subscriptionId: subscription.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, dbUser.id));

        // Insert/sync into subscriptions table
        await db
          .insert(subscriptions)
          .values({
            userId: dbUser.id,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            status: 'active',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          })
          .onConflictDoUpdate({
            target: subscriptions.stripeSubscriptionId,
            set: {
              status: 'active',
              stripePriceId: priceId,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: new Date(),
            },
          });

        // Trigger welcome/subscription activation email
        if (dbUser.email) {
          try {
            await sendSubscriptionActiveEmail(dbUser.email, dbUser.name || 'Founder');
          } catch (emailErr) {
            console.error('Failed to send subscription active email:', emailErr);
          }
        }

        console.log(`Subscription created successfully for user ${dbUser.id}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        const userId = subscription.metadata.userId;
        let dbUser = null;

        if (userId) {
          [dbUser] = await db.select().from(users).where(eq(users.id, userId));
        } else {
          [dbUser] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
        }

        if (!dbUser) {
          console.error(`User not found for customer ID: ${customerId}`);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;
        const tier = priceId === process.env.STRIPE_PRICE_GROWTH ? 'growth' : 'starter';
        const status = subscription.status === 'active' ? 'active' : subscription.status;

        // Update users table
        await db
          .update(users)
          .set({
            subscriptionTier: status === 'active' ? tier : 'free',
            subscriptionStatus: status,
            subscriptionId: subscription.id,
            updatedAt: new Date(),
          })
          .where(eq(users.id, dbUser.id));

        // Update subscriptions table
        await db
          .update(subscriptions)
          .set({
            stripePriceId: priceId,
            status: status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        console.log(`Subscription updated successfully for user ${dbUser.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        let dbUser = null;
        const userId = subscription.metadata.userId;

        if (userId) {
          [dbUser] = await db.select().from(users).where(eq(users.id, userId));
        } else {
          [dbUser] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
        }

        if (!dbUser) {
          console.error(`User not found for customer ID: ${customerId}`);
          break;
        }

        // Update users table
        await db
          .update(users)
          .set({
            subscriptionTier: 'free',
            subscriptionStatus: 'canceled',
            subscriptionId: null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, dbUser.id));

        // Update subscriptions table status
        await db
          .update(subscriptions)
          .set({
            status: 'canceled',
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        if (dbUser.email) {
          try {
            await sendSubscriptionCanceledEmail(dbUser.email);
          } catch (emailErr) {
            console.error('Failed to send subscription canceled email:', emailErr);
          }
        }

        console.log(`Subscription deleted/canceled for user ${dbUser.id}`);
        break;
      }

      case 'checkout.session.completed': {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = checkoutSession.subscription as string;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price.id;
        const introPrice = process.env.STRIPE_PRICE_STARTER_INTRO?.trim();
        const regularPrice = process.env.STRIPE_PRICE_STARTER?.trim();

        if (priceId === introPrice && regularPrice) {
          await stripe.subscriptionSchedules.create({
            from_subscription: subscriptionId,
            end_behavior: 'release',
            phases: [
              { items: [{ price: introPrice }], iterations: 1 },
              { items: [{ price: regularPrice }] },
            ],
          });
          console.log(`[Stripe Webhook] Intro→Regular schedule created for subscription ${subscriptionId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Stripe Webhook] Invoice payment succeeded: ${invoice.id} for customer ${invoice.customer}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const [dbUser] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
        if (dbUser) {
          await db
            .update(users)
            .set({
              subscriptionStatus: 'past_due',
              updatedAt: new Date(),
            })
            .where(eq(users.id, dbUser.id));

          if (dbUser.email) {
            try {
              const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
              const retryLink = `${appUrl}/dashboard/settings`;
              await sendPaymentFailedEmail(dbUser.email, retryLink);
            } catch (emailErr) {
              console.error('Failed to send payment failed email:', emailErr);
            }
          }
        }

        console.log(`[Stripe Webhook] SEND PAYMENT FAILED EMAIL: Invoice payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook event handling error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
