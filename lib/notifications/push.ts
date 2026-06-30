import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@stormo.io',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/**
 * Sends a push notification to all active subscriptions for a user.
 * Rate limited to max 2 per subscription per day.
 * Automatically removes subscriptions that return 410 (expired/unsubscribed).
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; skipped: number }> {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not configured — skipping');
    return { sent: 0, skipped: 0 };
  }

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  if (subs.length === 0) return { sent: 0, skipped: 0 };

  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let sent = 0;
  let skipped = 0;

  for (const sub of subs) {
    // Reset daily counter if it's a new day
    const isNewDay = sub.sentTodayDate !== todayStr;
    const currentCount = isNewDay ? 0 : (sub.sentToday ?? 0);

    if (currentCount >= 2) {
      skipped++;
      continue;
    }

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url ?? '/dashboard',
          tag: payload.tag ?? 'stormo-push',
        })
      );

      await db
        .update(pushSubscriptions)
        .set({
          sentToday: currentCount + 1,
          sentTodayDate: todayStr,
        })
        .where(eq(pushSubscriptions.id, sub.id));

      sent++;
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      if (status === 410 || status === 404) {
        // Subscription expired — remove it
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
        console.log(`[Push] Removed expired subscription for user ${userId}`);
      } else {
        console.error(`[Push] Failed to send to ${sub.endpoint}:`, err?.message ?? err);
      }
    }
  }

  return { sent, skipped };
}
