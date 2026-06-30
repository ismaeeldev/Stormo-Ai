import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, actions } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { generateDailyAction } from '@/lib/ai/action-generator';
import {
  triggerInactiveDay3,
  triggerInactiveDay7,
  triggerInactiveDay14,
} from '@/lib/email/triggers';
import { sendPushNotification } from '@/lib/notifications/push';

export const maxDuration = 300;

/** Returns true if the current moment is the 8am hour in the given IANA timezone. */
function isCurrently8amIn(timezone: string): boolean {
  try {
    const localHour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }).format(new Date()),
      10
    );
    return localHour === 8;
  } catch {
    return false;
  }
}

/** Returns today's date string (YYYY-MM-DD) in the given IANA timezone. */
function getLocalDateString(timezone: string): string {
  try {
    // en-CA locale produces YYYY-MM-DD format
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone });
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let generated = 0, skipped = 0, failed = 0;

  try {
    // Only process active users who have completed onboarding
    const eligibleUsers = await db
      .select({
        id: users.id,
        timezone: users.timezone,
      })
      .from(users)
      .where(
        and(
          eq(users.onboardingCompleted, true),
          eq(users.subscriptionStatus, 'active')
        )
      );

    for (const user of eligibleUsers) {
      const tz = user.timezone ?? 'UTC';

      // Only process users whose local time is currently 8am
      if (!isCurrently8amIn(tz)) continue;

      const localDate = getLocalDateString(tz);

      try {
        // Check if action already exists for today (idempotent)
        const [existing] = await db
          .select({ id: actions.id })
          .from(actions)
          .where(
            and(
              eq(actions.userId, user.id),
              eq(actions.scheduledFor, localDate)
            )
          )
          .limit(1);

        if (existing) {
          skipped++;
          continue;
        }

        await generateDailyAction(user.id, localDate);
        generated++;

        // Push: "Your daily action is ready"
        sendPushNotification(user.id, {
          title: 'Your daily action is ready 🎯',
          body: 'Open Stormo to see today\'s marketing task.',
          url: '/dashboard',
          tag: 'daily-action',
        }).catch((e) => console.error(`[cron/daily-actions] Push failed for ${user.id}:`, e));
      } catch (err) {
        console.error(`[cron/daily-actions] Failed for user ${user.id}:`, err);
        failed++;
        // Continue — one failure must not block others
      }
    }
  } catch (err: any) {
    console.error('[cron/daily-actions] Fatal error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // ── Inactive user detection pass ──────────────────────────────────────────
  let inactiveEmailed = 0;
  try {
    const now = Date.now();
    const threeDaysAgo = new Date(now - 3 * 86_400_000);

    const inactiveUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        lastLoginAt: users.lastLoginAt,
        inactiveEmailStage: users.inactiveEmailStage,
      })
      .from(users)
      .where(
        and(
          eq(users.onboardingCompleted, true),
          lt(users.lastLoginAt, threeDaysAgo),
          lt(users.inactiveEmailStage, 14)
        )
      );

    for (const u of inactiveUsers) {
      if (!u.lastLoginAt || !u.email) continue;
      const daysSince = Math.floor((now - u.lastLoginAt.getTime()) / 86_400_000);
      const stage = u.inactiveEmailStage ?? 0;

      try {
        if (daysSince >= 14 && stage < 14) {
          await triggerInactiveDay14(u.email, u.name ?? 'there');
          await db.update(users).set({ inactiveEmailStage: 14 }).where(eq(users.id, u.id));
          inactiveEmailed++;
        } else if (daysSince >= 7 && stage < 7) {
          await triggerInactiveDay7(u.email, u.name ?? 'there');
          await db.update(users).set({ inactiveEmailStage: 7 }).where(eq(users.id, u.id));
          inactiveEmailed++;
          sendPushNotification(u.id, {
            title: 'It has been a week 👋',
            body: 'Your plan is still here. One action today gets you back on track.',
            url: '/dashboard',
            tag: 'inactive',
          }).catch(() => {});
        } else if (daysSince >= 3 && stage < 3) {
          await triggerInactiveDay3(u.email, u.name ?? 'there');
          await db.update(users).set({ inactiveEmailStage: 3 }).where(eq(users.id, u.id));
          inactiveEmailed++;
          // Also push for day-3 inactive
          sendPushNotification(u.id, {
            title: 'Your store misses you 👋',
            body: 'Log back in — today\'s action takes under 30 minutes.',
            url: '/dashboard',
            tag: 'inactive',
          }).catch(() => {});
        }
      } catch (e) {
        console.error(`[cron/daily-actions] Inactive email failed for user ${u.id}:`, e);
        // Continue — one failure must not block others
      }
    }
  } catch (e) {
    // Non-fatal — log and continue
    console.error('[cron/daily-actions] Inactive detection pass failed:', e);
  }

  return NextResponse.json({ success: true, generated, skipped, failed, inactiveEmailed });
}
