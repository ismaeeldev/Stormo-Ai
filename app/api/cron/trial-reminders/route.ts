import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, isNotNull, and, lt, gte } from 'drizzle-orm';
import {
  triggerTrialEnding,
  triggerMonthlyMilestone,
  triggerCancellationReEngagement,
} from '@/lib/email/triggers';

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  let emailsSent = 0;
  let errors = 0;

  // ── Trial ending + monthly milestone pass ─────────────────────────────────
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        trialEndsAt: users.trialEndsAt,
        createdAt: users.createdAt,
        trialEmail15Sent: users.trialEmail15Sent,
        trialEmail3Sent: users.trialEmail3Sent,
        trialEmail1Sent: users.trialEmail1Sent,
        monthlyMilestoneSent: users.monthlyMilestoneSent,
      })
      .from(users)
      .where(isNotNull(users.email));

    for (const u of allUsers) {
      if (!u.email) continue;
      const name = u.name ?? 'Founder';

      // ── Trial ending emails ────────────────────────────────────────────────
      if (u.trialEndsAt) {
        const msUntilEnd = u.trialEndsAt.getTime() - now.getTime();
        const daysUntil = Math.round(msUntilEnd / 86_400_000);

        if (daysUntil === 15 && !u.trialEmail15Sent) {
          try {
            await triggerTrialEnding(u.email, name, 15);
            await db.update(users).set({ trialEmail15Sent: true }).where(eq(users.id, u.id));
            emailsSent++;
          } catch (e) {
            console.error(`[trial-reminders] 15-day email failed for ${u.id}:`, e);
            errors++;
          }
        }

        if (daysUntil === 3 && !u.trialEmail3Sent) {
          try {
            await triggerTrialEnding(u.email, name, 3);
            await db.update(users).set({ trialEmail3Sent: true }).where(eq(users.id, u.id));
            emailsSent++;
          } catch (e) {
            console.error(`[trial-reminders] 3-day email failed for ${u.id}:`, e);
            errors++;
          }
        }

        if (daysUntil === 1 && !u.trialEmail1Sent) {
          try {
            await triggerTrialEnding(u.email, name, 1);
            await db.update(users).set({ trialEmail1Sent: true }).where(eq(users.id, u.id));
            emailsSent++;
          } catch (e) {
            console.error(`[trial-reminders] 1-day email failed for ${u.id}:`, e);
            errors++;
          }
        }
      }

      // ── Monthly milestone email (day 30) ───────────────────────────────────
      if (u.createdAt && !u.monthlyMilestoneSent) {
        const daysSince = Math.round((now.getTime() - u.createdAt.getTime()) / 86_400_000);
        if (daysSince >= 30) {
          try {
            await triggerMonthlyMilestone(u.email, name, daysSince);
            await db.update(users).set({ monthlyMilestoneSent: true }).where(eq(users.id, u.id));
            emailsSent++;
          } catch (e) {
            console.error(`[trial-reminders] monthly milestone email failed for ${u.id}:`, e);
            errors++;
          }
        }
      }
    }
  } catch (err: any) {
    console.error('[trial-reminders] Fatal error in main pass:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // ── 7-day cancellation re-engagement pass ─────────────────────────────────
  try {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 86_400_000);

    const cancelledUsers = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(
        and(
          isNotNull(users.cancelledAt),
          gte(users.cancelledAt, eightDaysAgo),
          lt(users.cancelledAt, sevenDaysAgo),
          eq(users.cancellationReEngagementSent, false)
        )
      );

    for (const u of cancelledUsers) {
      if (!u.email) continue;
      try {
        await triggerCancellationReEngagement(u.email, u.name ?? 'Founder');
        await db
          .update(users)
          .set({ cancellationReEngagementSent: true })
          .where(eq(users.id, u.id));
        emailsSent++;
      } catch (e) {
        console.error(`[trial-reminders] cancellation re-engagement failed for ${u.id}:`, e);
        errors++;
      }
    }
  } catch (err: any) {
    // Non-fatal — log and continue
    console.error('[trial-reminders] Cancellation re-engagement pass failed:', err);
  }

  return NextResponse.json({ success: true, emailsSent, errors });
}
