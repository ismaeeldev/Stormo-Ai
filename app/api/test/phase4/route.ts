/**
 * DEV-ONLY — Phase 4 comprehensive test endpoint.
 * Returns 404 in production.
 *
 * Tests:
 *   GET /api/test/phase4?test=banners&email=x      → force banner conditions via DB
 *   GET /api/test/phase4?test=push&userId=x        → send a test push notification
 *   GET /api/test/phase4?test=weekly-summary       → run weekly-summary cron inline
 *   GET /api/test/phase4?test=insight              → run insights cron inline
 *   GET /api/test/phase4?test=reengagement-check   → show current inactive-email state for all users
 *   GET /api/test/phase4?test=all                  → run all cron passes and report
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPushNotification } from '@/lib/notifications/push';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test');
  const base = new URL(request.url).origin;
  const cronHeaders = {
    Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}`,
  };

  // ── 4.1 Banner conditions ──────────────────────────────────────────────────
  if (test === 'banners') {
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Pass ?email=<address>' }, { status: 400 });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });

    return NextResponse.json({
      userId: user.id,
      currentState: {
        totalSales: user.totalSales,
        growthUnlocked: user.growthUnlocked,
        subscriptionTier: user.subscriptionTier,
        trialEndsAt: user.trialEndsAt,
      },
      bannerConditions: {
        'trial-ending': user.trialEndsAt
          ? `${Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / 86_400_000)} days left`
          : 'not set',
        'growth-available': user.growthUnlocked && user.subscriptionTier === 'starter',
        'eight-sales': user.totalSales === 8,
        'first-sale': user.totalSales === 1,
        'first-action': 'fetch GET /api/progress to check completedCount === 1',
        'log-results': 'fetch GET /api/progress to check hasUnloggedAction',
      },
      instructions: {
        'Force trial-ending': `UPDATE users SET trial_ends_at = NOW() + INTERVAL '2 days' WHERE id = '${user.id}'`,
        'Force growth-available': `UPDATE users SET growth_unlocked = true, subscription_tier = 'starter' WHERE id = '${user.id}'`,
        'Force 8-sales': `UPDATE users SET total_sales = 8 WHERE id = '${user.id}'`,
        'Force first-sale': `UPDATE users SET total_sales = 1 WHERE id = '${user.id}'`,
      },
    });
  }

  // ── 4.2 Push notification test ─────────────────────────────────────────────
  if (test === 'push') {
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Pass ?userId=<id>' }, { status: 400 });

    const subs = await db
      .select({ id: pushSubscriptions.id, endpoint: pushSubscriptions.endpoint })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) {
      return NextResponse.json({
        subscriptions: 0,
        message: 'No push subscriptions found. Enable notifications on the dashboard first.',
      });
    }

    const result = await sendPushNotification(userId, {
      title: 'Phase 4.2 Test 🎯',
      body: 'Push notifications are working correctly.',
      url: '/dashboard',
      tag: 'test',
    });

    return NextResponse.json({
      subscriptions: subs.length,
      endpoints: subs.map((s) => s.endpoint.slice(0, 60) + '…'),
      ...result,
    });
  }

  // ── 4.3 Weekly summary cron ────────────────────────────────────────────────
  if (test === 'weekly-summary') {
    const res = await fetch(`${base}/api/cron/weekly-summary`, { headers: cronHeaders });
    const json = await res.json();
    return NextResponse.json({ weeklySum: json });
  }

  // ── 4.4 Insights cron ─────────────────────────────────────────────────────
  if (test === 'insight') {
    const res = await fetch(`${base}/api/cron/insights`, { headers: cronHeaders });
    const json = await res.json();
    return NextResponse.json({ insights: json });
  }

  // ── 4.5 Re-engagement state check ─────────────────────────────────────────
  if (test === 'reengagement-check') {
    const now = Date.now();
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        lastLoginAt: users.lastLoginAt,
        inactiveEmailStage: users.inactiveEmailStage,
        onboardingCompleted: users.onboardingCompleted,
      })
      .from(users)
      .where(eq(users.onboardingCompleted, true));

    const report = allUsers.map((u) => {
      const daysSince = u.lastLoginAt
        ? Math.floor((now - u.lastLoginAt.getTime()) / 86_400_000)
        : null;
      let nextAction = 'N/A';
      if (daysSince !== null) {
        const stage = u.inactiveEmailStage ?? 0;
        if (daysSince >= 14 && stage < 14) nextAction = 'WILL send day-14 email + push';
        else if (daysSince >= 7 && stage < 7) nextAction = 'WILL send day-7 email + push';
        else if (daysSince >= 3 && stage < 3) nextAction = 'WILL send day-3 email + push';
        else if (stage >= 14) nextAction = 'Max stage reached — no more contact';
        else nextAction = `Active (${daysSince}d ago) — no action needed`;
      }
      return { email: u.email, daysSince, stage: u.inactiveEmailStage, nextAction };
    });

    return NextResponse.json({ users: report });
  }

  // ── Run all ────────────────────────────────────────────────────────────────
  if (test === 'all') {
    const [weeklySumRes, insightRes] = await Promise.all([
      fetch(`${base}/api/cron/weekly-summary`, { headers: cronHeaders }).then((r) => r.json()),
      fetch(`${base}/api/cron/insights`, { headers: cronHeaders }).then((r) => r.json()),
    ]);

    return NextResponse.json({
      '4.3_weekly_summary': weeklySumRes,
      '4.4_insights': insightRes,
      '4.5_reengagement': 'Run daily-actions cron to test: GET /api/cron/daily-actions',
    });
  }

  return NextResponse.json({
    available: ['banners', 'push', 'weekly-summary', 'insight', 'reengagement-check', 'all'],
    usage: 'GET /api/test/phase4?test=<name>[&email=x&userId=x]',
  });
}
