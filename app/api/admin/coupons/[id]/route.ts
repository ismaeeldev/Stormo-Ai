import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminSession } from '@/lib/admin-auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { name, code, planType, maxRedemptions, expiresAt, isActive } = await request.json();

  if (!['starter', 'growth'].includes(planType)) {
    return NextResponse.json({ error: 'planType must be starter or growth' }, { status: 400 });
  }

  const [updated] = await db
    .update(coupons)
    .set({
      name,
      code: code.toUpperCase().trim(),
      planType,
      maxRedemptions: Number(maxRedemptions),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: Boolean(isActive),
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await db.delete(coupons).where(eq(coupons.id, id));
  return NextResponse.json({ ok: true });
}
