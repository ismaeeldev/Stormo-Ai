import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, sales } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { checkAndAwardMilestones } from '@/lib/milestones/check-milestones';
import {
  triggerFirstSaleLogged,
  triggerFiveSalesLogged,
  triggerGrowthUnlocked,
} from '@/lib/email/triggers';
import { sendPushNotification } from '@/lib/notifications/push';

const GROWTH_THRESHOLD = 10;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const [userRow, salesList] = await Promise.all([
      db
        .select({ totalSales: users.totalSales, growthUnlocked: users.growthUnlocked })
        .from(users)
        .where(eq(users.id, userId))
        .then(([r]) => r),
      db
        .select()
        .from(sales)
        .where(eq(sales.userId, userId))
        .orderBy(desc(sales.loggedAt))
        .limit(50),
    ]);

    return NextResponse.json({
      totalSales: userRow?.totalSales ?? 0,
      growthUnlocked: userRow?.growthUnlocked ?? false,
      sales: salesList,
    });
  } catch (error: any) {
    console.error('[GET /api/sales]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json().catch(() => ({}));
    const { actionId, channel, notes } = body as {
      actionId?: string;
      channel?: string;
      notes?: string;
    };

    // Insert sale record
    await db.insert(sales).values({
      userId,
      actionId: actionId ?? null,
      channel: channel ?? null,
      notes: notes ?? null,
    });

    // Atomically increment totalSales and get the new value
    const [updatedUser] = await db
      .update(users)
      .set({ totalSales: sql`coalesce(${users.totalSales}, 0) + 1` })
      .where(eq(users.id, userId))
      .returning({ totalSales: users.totalSales });

    const newTotal = updatedUser?.totalSales ?? 0;

    let growthUnlocked = false;

    // Fetch user record once for all email triggers below
    const [userRecord] = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, userId));
    const userName = userRecord?.name ?? 'Founder';
    const userEmail = userRecord?.email;

    // Sales milestone emails (non-blocking, fire-and-forget)
    if (userEmail) {
      const prevTotal = newTotal - 1;
      if (prevTotal === 0) {
        // First ever sale
        triggerFirstSaleLogged(userEmail, userName)
          .catch((e) => console.error('[sales] first sale email failed:', e));
      } else if (newTotal === 5) {
        triggerFiveSalesLogged(userEmail, userName)
          .catch((e) => console.error('[sales] five sales email failed:', e));
      } else if (newTotal === 8) {
        // Push: 2 away from Growth unlock
        sendPushNotification(userId, {
          title: 'You\'re 2 sales away from Growth! 🚀',
          body: 'Keep going — unlock advanced features at 10 sales.',
          url: '/dashboard',
          tag: 'milestone-8-sales',
        }).catch(() => {});
      }
    }

    if (newTotal >= GROWTH_THRESHOLD) {
      // Atomically mark growthUnlocked=true only if it was false — race-condition safe
      const [justSet] = await db
        .update(users)
        .set({ growthUnlocked: true, updatedAt: new Date() })
        .where(and(eq(users.id, userId), eq(users.growthUnlocked, false)))
        .returning({ growthUnlocked: users.growthUnlocked });

      growthUnlocked = true;

      // Send growth unlock email only once — when we're the one who just set the flag
      if (justSet && userEmail) {
        triggerGrowthUnlocked(userEmail, userName)
          .catch((e) => console.error('[sales] growth unlock email failed:', e));
      }
    }

    // Fire milestone checks (first_sale + ten_sales) — non-blocking
    checkAndAwardMilestones(userId, 'sale_reported').catch((e) =>
      console.error('[sales] milestone check failed:', e)
    );

    return NextResponse.json({
      success: true,
      totalSales: newTotal,
      growthUnlocked,
    });
  } catch (error: any) {
    console.error('[POST /api/sales]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
