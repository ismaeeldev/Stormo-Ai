'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Unlock, Shield, Loader2, Tag, ChevronDown } from 'lucide-react';

export default function PricingSection() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [loadingPlan, setLoadingPlan] = useState<'starter' | 'growth' | null>(null);
  const [error, setError] = useState('');

  const [userTier, setUserTier] = useState<string>('free');
  const [userSales, setUserSales] = useState<number>(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/user/settings')
      .then((r) => r.json())
      .then((d) => {
        setUserTier(d.tier || 'free');
        setUserSales(d.totalSales || 0);
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, [status]);

  const growthUnlocked = userSales >= 10;
  const isCurrentStarter = userTier === 'starter';
  const isCurrentGrowth = userTier === 'growth';

  const handleSubscribe = async (plan: 'starter' | 'growth') => {
    setError('');
    setLoadingPlan(plan);

    if (status === 'unauthenticated') {
      router.push(`/register?redirect=/pricing&plan=${plan}`);
      return;
    }

    try {
      if (plan === 'growth' && isCurrentStarter) {
        const response = await fetch('/api/stripe/upgrade-to-growth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to upgrade');
        router.push('/dashboard?upgraded=true');
        return;
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
      if (data.url) window.location.href = data.url;
      else throw new Error('No checkout URL returned');
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setLoadingPlan(null);
    }
  };

  async function handleCouponRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponSuccess('');
    setCouponLoading(true);
    try {
      const res = await fetch('/api/redeem-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setCouponError(data.error || 'Invalid coupon code'); return; }
      setCouponSuccess(`Coupon applied! Activating your ${data.planType} plan…`);
      await update();
      setTimeout(() => router.push('/onboarding'), 1500);
    } catch {
      setCouponError('Network error — please try again');
    } finally {
      setCouponLoading(false);
    }
  }

  const starterFeatures = [
    'Daily action plan tailored to your store',
    'AI Social & Email Content Hub templates',
    'Micro-influencer CRM (20 contacts max)',
    'Milestone tracker & confetti badges',
    'Ask Stormo AI marketing assistant',
  ];

  const growthFeatures = [
    'Everything in Starter Plan',
    'Advanced multi-channel marketing campaigns',
    '60-day calendar opportunity queue triggers',
    'Unlimited micro-influencer outreach tracks',
    'Priority customer service & platform support',
  ];

  return (
    <section id="pricing" className="relative py-24 bg-[#F8F9FA] pb-24 sm:pb-32 md:pb-40 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-[#666666] text-base sm:text-lg mt-3">
            No long-term contracts, no setup fees. Choose the tier that matches your store volume.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-destructive text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">

          {/* STARTER CARD */}
          <div className="group bg-white rounded-[2rem] border border-[#EBEBEB] p-8 sm:p-10 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-[#FFF0EB] px-3.5 py-1.5 rounded-full">
                  Starter Tier
                </span>
                {isCurrentStarter && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex flex-col">
                  <span className="text-5xl sm:text-6xl font-extrabold text-[#1A1A1A] tracking-tight">$9</span>
                  <span className="text-sm sm:text-base font-bold text-primary mt-1">First 30 Days</span>
                </div>
                <div className="text-primary text-2xl font-light">→</div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#888888] uppercase tracking-wider mb-0.5">Then</span>
                  <div className="flex items-baseline">
                    <span className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A]">$29</span>
                    <span className="text-sm font-semibold text-[#888888]">/mo</span>
                  </div>
                  <span className="text-xs text-[#888888] mt-0.5">Starting Month 2</span>
                </div>
              </div>

              <div className="py-5 border-t border-b border-[#F0F0F0] mb-6">
                <p className="text-sm text-[#4A4A4A] leading-relaxed">
                  Start for just <strong>$9</strong> for your first 30 days. After that, it's <strong>$29</strong> per month.
                </p>
              </div>

              <ul className="space-y-4">
                {starterFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#2D2D2D] font-medium leading-tight">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              {isCurrentStarter ? (
                <div className="w-full bg-green-50 border border-green-200 text-green-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
                  <Check className="h-5 w-5" /> You're on this plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe('starter')}
                  disabled={loadingPlan !== null || status === 'loading' || isCurrentGrowth}
                  className="bg-primary hover:bg-[#D45214] text-white font-bold w-full py-4 rounded-2xl shadow-md hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                >
                  {loadingPlan === 'starter' ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Redirecting to Stripe...</>
                  ) : isCurrentGrowth ? 'Already on Growth Plan' : 'Get Started with Starter'}
                </button>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-[#888888]">
                <Shield className="h-3.5 w-3.5" />
                <span>Cancel anytime. No contracts. No hidden fees.</span>
              </div>
            </div>
          </div>

          {/* GROWTH CARD */}
          <div className={`group bg-[#0B0B0C] text-white rounded-[2rem] border p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 relative ${
            growthUnlocked
              ? 'border-primary/30 hover:shadow-[0_20px_50px_rgba(232,98,26,0.2)]'
              : 'border-white/5 hover:shadow-[0_20px_50px_rgba(232,98,26,0.08)] hover:border-primary/10'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0] bg-[#1F1F21] px-3.5 py-1.5 rounded-full">
                  Growth Tier
                </span>
                {isCurrentGrowth ? (
                  <span className="text-xs font-bold text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                ) : growthUnlocked ? (
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                    <Unlock className="h-3.5 w-3.5" /> Unlocked
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#A0A0A0] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary fill-primary/10" /> After 10 sales
                  </span>
                )}
              </div>

              <div className="mb-6">
                <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">$39</span>
                <p className="text-[#888888] text-[10px] sm:text-xs font-bold tracking-wider uppercase mt-2">
                  Per month billing (billed automatically)
                </p>
              </div>

              {status === 'authenticated' && settingsLoaded && !growthUnlocked && !isCurrentGrowth && (
                <div className="py-4 border-t border-[#1F1F21] mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] text-[#888888] font-semibold">Milestone to unlock</span>
                    <span className="text-[11px] font-bold text-primary">{userSales} / 10 sales</span>
                  </div>
                  <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-[#C4531A] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((userSales / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {(!settingsLoaded || status !== 'authenticated' || growthUnlocked || isCurrentGrowth) && (
                <div className="py-5 border-t border-[#1F1F21] mb-6">
                  <p className="text-sm text-[#A0A0A0] leading-relaxed">
                    {growthUnlocked
                      ? "You've hit 10 sales — Growth is now available for your store."
                      : 'Unlocks automatically once you hit 10 total sales.'}
                  </p>
                </div>
              )}

              <ul className="space-y-4">
                {growthFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-[#E0E0E0] font-medium leading-tight">
                    <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-8">
              {isCurrentGrowth ? (
                <div className="w-full bg-green-400/10 border border-green-400/20 text-green-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-sm">
                  <Check className="h-5 w-5" /> You're on this plan
                </div>
              ) : growthUnlocked ? (
                <button
                  onClick={() => handleSubscribe('growth')}
                  disabled={loadingPlan !== null || status === 'loading'}
                  className="bg-primary hover:bg-[#D45214] text-white font-bold w-full py-4 rounded-2xl shadow-lg hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                >
                  {loadingPlan === 'growth' ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> {isCurrentStarter ? 'Upgrading...' : 'Redirecting to Stripe...'}</>
                  ) : isCurrentStarter ? 'Upgrade to Growth — $39/mo' : 'Get Started with Growth'}
                </button>
              ) : (
                <button disabled className="bg-white/5 text-[#555555] font-bold w-full py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border border-white/5">
                  <Lock className="h-4 w-4 text-[#555555]" /> Unlocks at 10 sales
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Coupon section — only for logged-in users without an active plan */}
        {status === 'authenticated' && !isCurrentStarter && !isCurrentGrowth && (
          <div className="mt-16 max-w-md mx-auto border-t border-gray-200 pt-10">
            <button
              type="button"
              onClick={() => { setCouponOpen((o) => !o); setCouponError(''); setCouponSuccess(''); }}
              className="w-full flex items-center justify-center gap-2 text-sm text-subtle hover:text-dark transition-colors cursor-pointer"
            >
              <Tag className="h-4 w-4 text-primary" />
              Have a coupon code?
              <ChevronDown className={`h-4 w-4 transition-transform ${couponOpen ? 'rotate-180' : ''}`} />
            </button>

            {couponOpen && (
              <div className="mt-4 bg-white rounded-2xl border border-gray-100/60 shadow-[0_8px_24px_rgba(0,0,0,0.04)] p-5">
                {couponSuccess ? (
                  <div className="flex items-center gap-3 text-green-600 text-sm font-medium">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {couponSuccess}
                  </div>
                ) : (
                  <form onSubmit={handleCouponRedeem} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-200/80 rounded-xl px-4 py-3 text-sm font-mono tracking-widest uppercase text-dark bg-white/50 placeholder-gray-300 placeholder:normal-case placeholder:tracking-normal focus:bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all"
                      disabled={couponLoading}
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shadow-lg hover:shadow-primary/25"
                    >
                      {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError && <p className="mt-3 text-sm text-destructive">{couponError}</p>}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-[#666666] font-semibold">
          <Shield className="h-4 w-4 text-primary" />
          <span>No contracts. No hidden fees. Cancel anytime.</span>
        </div>
      </div>
    </section>
  );
}
