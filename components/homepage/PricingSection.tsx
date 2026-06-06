'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Star } from 'lucide-react';

export default function PricingSection() {
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
    <section id="pricing" className="py-24 bg-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-subtle text-base sm:text-lg mt-3">
            No long-term contracts, no setup fees. Choose the tier that matches your store volume.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* STARTER CARD (light gray bg) */}
          <div className="bg-[#F5F5F5] rounded-2xl shadow-md border border-gray-150 p-8 sm:p-10 flex flex-col justify-between hover:shadow-lg transition-shadow">
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
                <h3 className="text-4xl font-black text-dark">$9</h3>
                <p className="text-subtle text-xs uppercase font-bold tracking-wider">
                  First month introductory price, then $29/mo after
                </p>
              </div>
              <ul className="space-y-4 pt-6 border-t border-gray-200">
                {starterFeatures.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-dark font-medium">
                    <Check className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-8">
              <Link
                href="/register"
                className="bg-primary hover:bg-[#C4531A] text-white font-bold w-full py-3.5 rounded-lg shadow-md transition-colors block text-center"
                style={{ minHeight: '44px' }}
              >
                Get Started with Starter
              </Link>
            </div>
          </div>

          {/* GROWTH CARD (#1A1A1A bg, orange top border 3px) */}
          <div className="bg-[#1A1A1A] text-white rounded-2xl shadow-xl border-t-3 border-primary p-8 sm:p-10 flex flex-col justify-between hover:shadow-2xl transition-all transform hover:-translate-y-1">
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
                <h3 className="text-4xl font-black text-white">$39</h3>
                <p className="text-muted text-xs uppercase font-bold tracking-wider">
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
              <Link
                href="/register"
                className="bg-white hover:bg-[#FDF0E8] text-primary font-bold w-full py-3.5 rounded-lg shadow-md transition-colors block text-center"
                style={{ minHeight: '44px' }}
              >
                Upgrade to Growth
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
