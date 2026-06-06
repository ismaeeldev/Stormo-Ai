'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Zap, Check, Loader2 } from 'lucide-react';

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setError('');
    setIsLoading(true);

    if (status === 'unauthenticated') {
      router.push('/register?redirect=/pricing');
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setIsLoading(false);
    }
  };

  const features = [
    'Daily personalized marketing actions',
    'AI-powered weekly content creation (6 channels)',
    'Outreach lead tracking & outreach drafts',
    'Custom marketing milestones & achievements',
    'Repetition prevention system protection',
    'Email support & guidance',
  ];

  return (
    <div className="min-h-screen bg-light-bg py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-primary fill-primary" />
            <span className="text-3xl font-extrabold text-dark">Stormo.io</span>
          </Link>
          <h1 className="text-4xl font-extrabold text-dark sm:text-5xl sm:tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="max-w-xl mx-auto text-xl text-subtle mt-4">
            Get your complete automated AI marketing copilot and grow your SaaS.
          </p>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-destructive text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Pricing Card */}
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border-t-3 border-primary transition-all hover:translate-y-[-2px] hover:shadow-2xl">
          <div className="px-6 py-8 sm:p-10 sm:pb-6">
            <div className="flex justify-between items-baseline">
              <h2 className="text-2xl leading-6 font-semibold text-dark">
                Starter Plan
              </h2>
              <span className="px-3 py-1 text-xs font-semibold text-primary bg-orange-tint rounded-full uppercase tracking-wider">
                Intro Offer
              </span>
            </div>
            <div className="mt-4 flex items-baseline text-dark">
              <span className="text-5xl font-extrabold tracking-tight">$9</span>
              <span className="ml-1 text-xl font-semibold text-subtle">/month</span>
            </div>
            <p className="mt-5 text-sm text-subtle">
              Full access to Stormo's premium AI marketing toolchain to start scale-up.
            </p>
          </div>

          <div className="px-6 pt-6 pb-8 sm:px-10 sm:pt-6">
            <h3 className="text-xs font-semibold text-dark uppercase tracking-wider">
              What's included
            </h3>
            <ul className="mt-4 space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <p className="ml-3 text-sm text-subtle">{feature}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                onClick={handleSubscribe}
                disabled={isLoading || status === 'loading'}
                className="w-full bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-6 py-4 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirecting to Stripe...
                  </>
                ) : (
                  'Start for $9'
                )}
              </button>
            </div>
            
            <p className="mt-4 text-center text-xs text-subtle">
              Secured payments powered by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
