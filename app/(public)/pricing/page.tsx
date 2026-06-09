'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Star, Loader2 } from 'lucide-react';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<'starter' | 'growth' | null>(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    document.title = "Simple & Transparent Pricing | Stormo.io";
  }, []);

  const handleSubscribe = async (plan: 'starter' | 'growth') => {
    setError('');
    setLoadingPlan(plan);

    if (status === 'unauthenticated') {
      router.push(`/register?redirect=/pricing&plan=${plan}`);
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
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
            Get your complete automated AI marketing copilot and grow your SaaS.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-destructive text-sm rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          
          {/* STARTER CARD (light/white card matching login/signup feel) */}
          <div className="group bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.02)] border border-gray-100/60 p-8 sm:p-10 flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(232,98,26,0.06)] hover:border-primary/10 transition-all duration-500 transform hover:-translate-y-1.5">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3.5 py-1 rounded-full">
                  Starter Tier
                </span>
                <span className="text-sm font-semibold text-subtle line-through">
                  $29/mo
                </span>
              </div>
              <div className="space-y-1 mb-6">
                <div className="flex items-baseline text-dark">
                  <span className="text-5xl font-black tracking-tight group-hover:text-primary transition-colors duration-300">$9</span>
                  <span className="ml-1 text-lg font-semibold text-subtle">/month</span>
                </div>
                <p className="text-subtle text-xs uppercase font-bold tracking-wider mt-2">
                  First month introductory price, then $29/mo after
                </p>
              </div>
              <ul className="space-y-4 pt-6 border-t border-gray-100">
                {starterFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-dark font-medium">
                    <Check className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <button
                onClick={() => handleSubscribe('starter')}
                disabled={loadingPlan !== null || status === 'loading'}
                className="w-full bg-primary hover:bg-[#C4531A] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-primary/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform group-hover:scale-[1.01]"
              >
                {loadingPlan === 'starter' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  'Get Started with Starter'
                )}
              </button>
            </div>
          </div>

          {/* GROWTH CARD (#1A1A1A dark accent layout to stand out) */}
          <div className="group bg-[#1A1A1A] text-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-white/5 p-8 sm:p-10 flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(232,98,26,0.15)] hover:border-primary/30 transition-all duration-500 transform hover:-translate-y-1.5">
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-white bg-white/10 px-3.5 py-1 rounded-full">
                  Growth Tier
                </span>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-current" />
                  Unlocked at 10 sales
                </span>
              </div>
              <div className="space-y-1 mb-6">
                <div className="flex items-baseline text-white">
                  <span className="text-5xl font-black tracking-tight">$39</span>
                  <span className="ml-1 text-lg font-semibold text-white/60">/month</span>
                </div>
                <p className="text-white/60 text-xs uppercase font-bold tracking-wider mt-2">
                  Per month billing (billed automatically)
                </p>
              </div>
              <ul className="space-y-4 pt-6 border-t border-white/10">
                {growthFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/95">
                    <Check className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <button
                onClick={() => handleSubscribe('growth')}
                disabled={loadingPlan !== null || status === 'loading'}
                className="w-full bg-white hover:bg-[#FDF0E8] hover:text-primary text-primary font-bold py-3.5 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform group-hover:scale-[1.01]"
              >
                {loadingPlan === 'growth' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  'Upgrade to Growth'
                )}
              </button>
            </div>
          </div>

        </div>

        <p className="mt-8 text-center text-xs text-subtle">
          Secured payments powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
