import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { getAdminSession } from '@/lib/admin-auth';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const all = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  return NextResponse.json(all);
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, code, planType, maxRedemptions, expiresAt } = await request.json();

  if (!name || !code || !planType || !maxRedemptions) {
    return NextResponse.json({ error: 'name, code, planType, maxRedemptions are required' }, { status: 400 });
  }
  if (!['starter', 'growth'].includes(planType)) {
    return NextResponse.json({ error: 'planType must be starter or growth' }, { status: 400 });
  }

  const [coupon] = await db
    .insert(coupons)
    .values({
      name,
      code: code.toUpperCase().trim(),
      planType,
      maxRedemptions: Number(maxRedemptions),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    })
    .returning();

  return NextResponse.json(coupon, { status: 201 });
}
