'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Lock, Unlock } from 'lucide-react';

export default function PricingClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<'starter' | 'growth' | null>(null);
  const [error, setError] = useState('');

  const [userTier, setUserTier] = useState<string>('free');
  const [userSales, setUserSales] = useState<number>(0);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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
      // Growth upgrade: user already has active starter subscription
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

      // New Stripe Checkout (starter intro or free → growth)
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
    <div className="min-h-[80vh] bg-[#F5F5F5] pt-28 pb-16 md:pt-36 md:pb-24 px-4 sm:px-6 lg:px-8 flex flex-col justify-center relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none select-none z-0"></div>

      <div className="max-w-5xl mx-auto w-full relative z-10">
        <div className="text-center mb-12 flex flex-col items-center">
          <h1 className="text-4xl font-extrabold text-dark sm:text-5xl tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="max-w-xl mx-auto text-base sm:text-lg text-subtle mt-4">
            Get your complete automated AI marketing copilot and grow your store.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-destructive text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards Grid */}
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
                  <Check className="h-5 w-5" />
                  You're on this plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe('starter')}
                  disabled={loadingPlan !== null || status === 'loading' || isCurrentGrowth}
                  className="w-full bg-primary hover:bg-[#D45214] text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                >
                  {loadingPlan === 'starter' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Redirecting to Stripe...
                    </>
                  ) : isCurrentGrowth ? (
                    'Already on Growth Plan'
                  ) : (
                    'Get Started with Starter'
                  )}
                </button>
              )}
              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-[#888888]">
                <Check className="h-3.5 w-3.5 text-primary" />
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
                    <Unlock className="h-3.5 w-3.5" />
                    Unlocked
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#A0A0A0] flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary fill-primary/10" />
                    After 10 sales
                  </span>
                )}
              </div>

              <div className="mb-6">
                <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">$39</span>
                <p className="text-[#888888] text-[10px] sm:text-xs font-bold tracking-wider uppercase mt-2">
                  Per month billing (billed automatically)
                </p>
              </div>

              {/* Sales progress bar for logged-in users not yet at 10 */}
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
                  <Check className="h-5 w-5" />
                  You're on this plan
                </div>
              ) : growthUnlocked ? (
                <button
                  onClick={() => handleSubscribe('growth')}
                  disabled={loadingPlan !== null || status === 'loading'}
                  className="bg-primary hover:bg-[#D45214] text-white font-bold w-full py-4 rounded-2xl shadow-lg hover:shadow-primary/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01]"
                >
                  {loadingPlan === 'growth' ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {isCurrentStarter ? 'Upgrading...' : 'Redirecting to Stripe...'}
                    </>
                  ) : isCurrentStarter ? (
                    'Upgrade to Growth — $39/mo'
                  ) : (
                    'Get Started with Growth'
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="bg-white/5 text-[#555555] font-bold w-full py-4 rounded-2xl flex items-center justify-center gap-2 cursor-not-allowed border border-white/5"
                >
                  <Lock className="h-4 w-4 text-[#555555]" />
                  Unlocks at 10 sales
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer info text */}
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-[#666666] font-semibold">
          <Check className="h-4 w-4 text-primary" />
          <span>No contracts. No hidden fees. Cancel anytime.</span>
        </div>
      </div>
    </div>
  );
}
