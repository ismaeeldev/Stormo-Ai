'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';

type FormValues = {
  name: string;
  code: string;
  planType: string;
  maxRedemptions: string;
  expiresAt: string;
  isActive: boolean;
};

type Props = {
  initial?: Partial<FormValues>;
  couponId?: string;
};

export default function CouponForm({ initial, couponId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(couponId);

  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? '',
    code: initial?.code ?? '',
    planType: initial?.planType ?? 'starter',
    maxRedemptions: initial?.maxRedemptions ?? '1',
    expiresAt: initial?.expiresAt ?? '',
    isActive: initial?.isActive ?? true,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormValues, value: string | boolean) {
    setValues((v) => ({ ...v, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(
        isEdit ? `/api/admin/coupons/${couponId}` : '/api/admin/coupons',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...values,
            code: values.code.toUpperCase().trim(),
            maxRedemptions: Number(values.maxRedemptions),
            expiresAt: values.expiresAt || null,
          }),
        },
      );
      if (res.ok) {
        router.push('/admin/coupons');
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-gray-200/80 rounded-xl px-4 py-3 text-base text-dark bg-white/50 placeholder-gray-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all";

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10 sm:py-16">
        {/* Back link */}
        <button
          onClick={() => router.push('/admin/coupons')}
          className="flex items-center gap-2 text-subtle hover:text-dark text-sm font-medium mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Coupons
        </button>

        <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-gray-100/60 overflow-hidden">
          {/* Dark header */}
          <div className="bg-[#1A1A1A] py-6 px-8 border-b border-white/5">
            <h1 className="text-white font-bold text-lg">
              {isEdit ? 'Edit Coupon' : 'New Coupon'}
            </h1>
            <p className="text-white/50 text-sm mt-1">
              {isEdit ? 'Update coupon details below' : 'Create a free-plan access code'}
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 text-destructive text-sm rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Coupon Name
                </label>
                <p className="text-xs text-subtle mb-2">Internal label — only you see this</p>
                <input
                  className={inputClass}
                  value={values.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                  placeholder="e.g. Launch Week, Beta Users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Coupon Code
                </label>
                <p className="text-xs text-subtle mb-2">Users enter this at checkout — auto-uppercased</p>
                <input
                  className={`${inputClass} font-mono tracking-widest uppercase`}
                  value={values.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  required
                  placeholder="LAUNCH50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">Plan Type</label>
                <p className="text-xs text-subtle mb-2">Which plan this code grants free access to</p>
                <select
                  className={inputClass}
                  value={values.planType}
                  onChange={(e) => set('planType', e.target.value)}
                >
                  <option value="starter">Starter</option>
                  <option value="growth">Growth</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">
                  Max Redemptions
                </label>
                <p className="text-xs text-subtle mb-2">How many users can use this code</p>
                <input
                  className={inputClass}
                  type="number"
                  min={1}
                  value={values.maxRedemptions}
                  onChange={(e) => set('maxRedemptions', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark mb-1.5">Expiry Date</label>
                <p className="text-xs text-subtle mb-2">Leave blank for no expiry</p>
                <input
                  className={inputClass}
                  type="datetime-local"
                  value={values.expiresAt}
                  onChange={(e) => set('expiresAt', e.target.value)}
                />
              </div>

              {isEdit && (
                <div className="flex items-center justify-between py-4 border-t border-gray-100">
                  <div>
                    <p className="text-sm font-medium text-dark">Active</p>
                    <p className="text-xs text-subtle mt-0.5">Disable to pause redemptions without deleting</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('isActive', !values.isActive)}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${values.isActive ? 'bg-primary' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${values.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/coupons')}
                  className="sm:flex-1 border border-gray-200/80 rounded-xl px-6 py-3.5 text-sm font-semibold text-subtle hover:text-dark hover:border-gray-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="sm:flex-1 bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl px-6 py-3.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/25 cursor-pointer"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : isEdit ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
