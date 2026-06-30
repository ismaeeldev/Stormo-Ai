/**
 * DEV-ONLY endpoint to fire any email trigger on demand.
 * Protected by NODE_ENV check — returns 404 in production.
 *
 * Usage:
 *   GET /api/test/emails?trigger=<name>&email=<address>
 *
 * Example:
 *   GET /api/test/emails?trigger=onboarding-complete&email=you@example.com
 */

import { NextResponse } from 'next/server';
import {
  triggerOnboardingComplete,
  triggerFirstActionAssigned,
  triggerFirstActionCompleted,
  triggerFirstSaleLogged,
  triggerFiveSalesLogged,
  triggerGrowthUnlocked,
  triggerTrialEnding,
  triggerMonthlyMilestone,
  triggerInactiveDay3,
  triggerInactiveDay7,
  triggerInactiveDay14,
  triggerCancellationScheduled,
  triggerCancellationReEngagement,
} from '@/lib/email/triggers';

type TriggerFn = (email: string) => Promise<any>;

const TRIGGERS: Record<string, TriggerFn> = {
  'onboarding-complete':       (e) => triggerOnboardingComplete(e, 'Test User'),
  'first-action-assigned':     (e) => triggerFirstActionAssigned(e, 'Test User', 'Post on Instagram'),
  'first-action-completed':    (e) => triggerFirstActionCompleted(e, 'Test User'),
  'first-sale':                (e) => triggerFirstSaleLogged(e, 'Test User'),
  'five-sales':                (e) => triggerFiveSalesLogged(e, 'Test User'),
  'growth-unlocked':           (e) => triggerGrowthUnlocked(e, 'Test User'),
  'trial-ending-15':           (e) => triggerTrialEnding(e, 'Test User', 15),
  'trial-ending-3':            (e) => triggerTrialEnding(e, 'Test User', 3),
  'trial-ending-1':            (e) => triggerTrialEnding(e, 'Test User', 1),
  'monthly-milestone':         (e) => triggerMonthlyMilestone(e, 'Test User', 30),
  'inactive-day3':             (e) => triggerInactiveDay3(e, 'Test User'),
  'inactive-day7':             (e) => triggerInactiveDay7(e, 'Test User'),
  'inactive-day14':            (e) => triggerInactiveDay14(e, 'Test User'),
  'cancellation-scheduled':    (e) => triggerCancellationScheduled(e, 'Test User', 'July 15, 2026'),
  'cancellation-reengagement': (e) => triggerCancellationReEngagement(e, 'Test User'),
};

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const trigger = searchParams.get('trigger');
  const email = searchParams.get('email');

  if (!trigger || !email) {
    return NextResponse.json(
      {
        error: 'Missing params. Use ?trigger=<name>&email=<address>',
        available: Object.keys(TRIGGERS),
      },
      { status: 400 }
    );
  }

  const fn = TRIGGERS[trigger];
  if (!fn) {
    return NextResponse.json(
      { error: `Unknown trigger "${trigger}"`, available: Object.keys(TRIGGERS) },
      { status: 400 }
    );
  }

  try {
    await fn(email);
    return NextResponse.json({ success: true, trigger, sentTo: email });
  } catch (err: any) {
    console.error(`[test/emails] ${trigger} failed:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
