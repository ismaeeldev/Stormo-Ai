import CouponForm from '../../CouponForm';
import { db } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!coupon) notFound();

  return (
    <CouponForm
      couponId={coupon.id}
      initial={{
        name: coupon.name,
        code: coupon.code,
        planType: coupon.planType,
        maxRedemptions: String(coupon.maxRedemptions),
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '',
        isActive: coupon.isActive,
      }}
    />
  );
}
