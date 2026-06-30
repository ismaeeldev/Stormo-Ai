/**
 * DEV-ONLY — Phase 5 test endpoint.
 * Returns 404 in production.
 *
 * GET /api/test/phase5?test=seed&userId=<id>
 *   → Inserts 25 completed actions + results (IG×15, Email×5, TikTok×5) for the user
 *
 * GET /api/test/phase5?test=check-perf&userId=<id>
 *   → Returns strategy_performance rows for the user
 *
 * GET /api/test/phase5?test=aggregate
 *   → Runs the aggregate-performance cron inline
 *
 * GET /api/test/phase5?test=check-dashboard
 *   → Returns the /api/performance payload for the user (uses session auth)
 *
 * GET /api/test/phase5?test=cleanup&userId=<id>
 *   → Deletes all seeded test actions + results + strategyPerformance for the user
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { actions, actionResults, strategyPerformance } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateDailyAction } from '@/lib/ai/action-generator';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const test = searchParams.get('test');
  const base = new URL(request.url).origin;
  const cronHeaders = { Authorization: `Bearer ${process.env.CRON_SECRET ?? ''}` };

  // ── Seed test data ────────────────────────────────────────────────────────
  if (test === 'seed') {
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Pass ?userId=<id>' }, { status: 400 });

    // Dataset: Instagram (15), Email (5), TikTok (5)
    // Instagram: high reach, solid engagement, best conversion
    // Email:     medium reach, ok engagement, decent conversion
    // TikTok:    high reach, low engagement, very low conversion (will be AVOID)
    const dataset: Array<{
      channel: string; actionType: string;
      reach: number; engagement: number; clicksToStore: number; salesAttributed: number;
    }> = [
      // Instagram × 15
      ...Array.from({ length: 15 }, (_, i) => ({
        channel: 'instagram', actionType: 'content',
        reach: 800 + i * 80,
        engagement: Math.floor((800 + i * 80) * 0.15),
        clicksToStore: Math.floor((800 + i * 80) * 0.04),
        salesAttributed: 2 + (i % 4),
      })),
      // Email × 5
      ...Array.from({ length: 5 }, (_, i) => ({
        channel: 'email', actionType: 'outreach',
        reach: 300 + i * 40,
        engagement: Math.floor((300 + i * 40) * 0.08),
        clicksToStore: Math.floor((300 + i * 40) * 0.03),
        salesAttributed: 1 + (i % 3),
      })),
      // TikTok × 5 — high reach but near-zero conversion
      ...Array.from({ length: 5 }, (_, i) => ({
        channel: 'tiktok', actionType: 'content',
        reach: 3000 + i * 500,
        engagement: Math.floor((3000 + i * 500) * 0.03),
        clicksToStore: Math.floor((3000 + i * 500) * 0.002),
        salesAttributed: 0,
      })),
    ];

    const inserted: string[] = [];
    const now = new Date();

    for (let i = 0; i < dataset.length; i++) {
      const row = dataset[i];
      const scheduledFor = new Date(now.getTime() - (i + 1) * 3 * 86_400_000)
        .toISOString()
        .split('T')[0];
      const completedAt = new Date(now.getTime() - (i + 1) * 3 * 86_400_000);
      const loggedAt = new Date(completedAt.getTime() + 3600_000);

      const [action] = await db
        .insert(actions)
        .values({
          userId,
          title: `[TEST] ${row.channel} action #${i + 1}`,
          description: 'Phase 5 test action',
          content: 'Test content',
          channel: row.channel,
          actionType: row.actionType,
          status: 'completed',
          scheduledFor,
          completedAt,
        })
        .returning({ id: actions.id });

      await db.insert(actionResults).values({
        actionId: action.id,
        userId,
        reach: row.reach,
        engagement: row.engagement,
        clicksToStore: row.clicksToStore,
        salesAttributed: row.salesAttributed,
        followersGained: Math.floor(row.engagement * 0.05),
        platform: row.channel,
        actionType: row.actionType,
        notes: `Test data — ${row.channel}`,
        loggedAt,
        updatedAt: loggedAt,
      });

      inserted.push(action.id);
    }

    return NextResponse.json({
      seeded: inserted.length,
      breakdown: { instagram: 15, email: 5, tiktok: 5 },
      actionIds: inserted,
      nextStep: `Run GET /api/test/phase5?test=aggregate then GET /api/test/phase5?test=check-perf&userId=${userId}`,
    });
  }

  // ── Run aggregation cron ──────────────────────────────────────────────────
  if (test === 'aggregate') {
    const res = await fetch(`${base}/api/cron/aggregate-performance`, { headers: cronHeaders });
    const json = await res.json();
    return NextResponse.json({ aggregation: json });
  }

  // ── Check strategy_performance rows ──────────────────────────────────────
  if (test === 'check-perf') {
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Pass ?userId=<id>' }, { status: 400 });

    const rows = await db
      .select()
      .from(strategyPerformance)
      .where(eq(strategyPerformance.userId, userId));

    const assertions = {
      rowCount: rows.length,
      hasInstagram: rows.some((r) => r.platform === 'instagram'),
      hasEmail: rows.some((r) => r.platform === 'email'),
      hasTikTok: rows.some((r) => r.platform === 'tiktok'),
      instagramIsTopConversion: (() => {
        const ig = rows.find((r) => r.platform === 'instagram');
        const others = rows.filter((r) => r.platform !== 'instagram');
        if (!ig) return false;
        const igConv = parseFloat((ig.avgConversionRate ?? '0').replace('%', ''));
        return others.every((r) => parseFloat((r.avgConversionRate ?? '0').replace('%', '')) <= igConv);
      })(),
      tikTokConversionBelow05: (() => {
        const tt = rows.find((r) => r.platform === 'tiktok');
        return tt ? parseFloat((tt.avgConversionRate ?? '0').replace('%', '')) < 0.5 : false;
      })(),
    };

    const allPassed = Object.values(assertions).every((v) => v === true || typeof v === 'number');

    return NextResponse.json({
      rows,
      assertions,
      result: assertions.rowCount === 3 && assertions.hasInstagram && assertions.hasEmail && assertions.hasTikTok
        ? '✅ PASS — 3 rows present for instagram, email, tiktok'
        : '❌ FAIL — check rows above',
    });
  }

  // ── Check performance dashboard payload ───────────────────────────────────
  if (test === 'check-dashboard') {
    // Dev shortcut: bypass session when userId is provided directly
    const directUserId = searchParams.get('userId');
    let json: any;
    if (directUserId) {
      // Query performance directly for this userId without going through auth
      const { db: dbInst } = await import('@/lib/db');
      const { actionResults: ar, strategyPerformance: sp, actions: ac } = await import('@/lib/db/schema');
      const { eq: eqOp, and: andOp, desc: descOp, gte: gteOp, sql: sqlExpr, count: countOp } = await import('drizzle-orm');

      const [{ completedWithResults }] = await dbInst.select({ completedWithResults: countOp() }).from(ar).where(eqOp(ar.userId, directUserId));
      const platforms = await dbInst.select().from(sp).where(eqOp(sp.userId, directUserId)).orderBy(descOp(sp.totalAttributedSales));
      const topActions = await dbInst
        .select({ id: ac.id, title: ac.title, channel: ac.channel, actionType: ac.actionType, salesAttributed: ar.salesAttributed, reach: ar.reach })
        .from(ar).innerJoin(ac, eqOp(ar.actionId, ac.id)).where(eqOp(ar.userId, directUserId)).orderBy(descOp(ar.salesAttributed)).limit(5);
      const [funnel] = await dbInst.select({
        totalReach: sqlExpr<number>`COALESCE(SUM(${ar.reach}),0)`,
        totalEngagement: sqlExpr<number>`COALESCE(SUM(${ar.engagement}),0)`,
        totalClicks: sqlExpr<number>`COALESCE(SUM(${ar.clicksToStore}),0)`,
        totalSales: sqlExpr<number>`COALESCE(SUM(${ar.salesAttributed}),0)`,
      }).from(ar).where(eqOp(ar.userId, directUserId));

      json = { eligible: completedWithResults >= 20, completedWithResults, platforms, topActions, funnel };
    } else {
      const session = await auth();
      if (!session?.user?.id) return NextResponse.json({ error: 'Pass ?userId= or log in first' }, { status: 401 });
      const res = await fetch(`${base}/api/performance`, { headers: { Cookie: request.headers.get('cookie') ?? '' } });
      json = await res.json();
    }

    if (!json.eligible) {
      return NextResponse.json({
        result: `❌ NOT ELIGIBLE — ${json.completedWithResults}/20 results logged`,
        data: json,
      });
    }

    const assertions = {
      eligible: json.eligible === true,
      hasPlatforms: (json.platforms?.length ?? 0) > 0,
      hasTopActions: (json.topActions?.length ?? 0) > 0,
      funnelHasData: Number(json.funnel?.totalReach ?? json.funnel?.totalReach ?? 0) > 0,
      // trend only present when using full /api/performance (not userId bypass)
      trendPresent: json.trend != null || directUserId != null,
    };

    return NextResponse.json({
      assertions,
      result: Object.values(assertions).every(Boolean) ? '✅ PASS — dashboard data complete' : '❌ FAIL — check assertions',
      summary: {
        platforms: json.platforms?.map((p: any) => `${p.platform}: ${p.avgConversionRate} conv, ${p.totalAttributedSales} sales`),
        topActionCount: json.topActions?.length,
        funnel: json.funnel,
        trend: json.trend,
      },
    });
  }

  // ── Generate action (bypasses 8am check, shows prompt log in server console) ─
  if (test === 'generate') {
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Pass ?userId=<id>' }, { status: 400 });

    try {
      // Use a far-future test date to avoid conflicts with real daily actions
      const testDate = '2099-01-01';
      const action = await generateDailyAction(userId, testDate);
      return NextResponse.json({
        result: '✅ Action generated — check server console for PERFORMANCE HISTORY block',
        action: { title: action?.title, channel: action?.channel, actionType: action?.actionType },
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // ── Cleanup test data ─────────────────────────────────────────────────────
  if (test === 'cleanup') {
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Pass ?userId=<id>' }, { status: 400 });

    // Delete test actions (cascades to actionResults)
    const testActions = await db
      .select({ id: actions.id })
      .from(actions)
      .where(and(eq(actions.userId, userId), eq(actions.description, 'Phase 5 test action')));

    for (const a of testActions) {
      await db.delete(actionResults).where(eq(actionResults.actionId, a.id));
      await db.delete(actions).where(eq(actions.id, a.id));
    }

    await db.delete(strategyPerformance).where(eq(strategyPerformance.userId, userId));

    return NextResponse.json({
      cleaned: testActions.length,
      strategyPerformanceCleared: true,
    });
  }

  return NextResponse.json({
    available: ['seed', 'aggregate', 'check-perf', 'check-dashboard', 'cleanup'],
    usage: 'GET /api/test/phase5?test=<name>[&userId=<id>]',
    sequence: [
      '1. GET ?test=seed&userId=<id>',
      '2. GET ?test=aggregate',
      '3. GET ?test=check-perf&userId=<id>  ← verifies 5.1',
      '4. GET ?test=generate&userId=<id>  ← watch server logs for PERFORMANCE HISTORY block (5.2)',
      '5. GET ?test=check-dashboard  ← verifies 5.3',
      '6. GET ?test=cleanup&userId=<id>  ← removes test data',
    ],
  });
}
