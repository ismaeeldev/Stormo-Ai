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
    <section id="pricing" className="relative py-24 bg-white pb-24 sm:pb-32 md:pb-40 scroll-mt-20">
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
          <div className="group bg-[#F5F5F5] rounded-3xl shadow-md p-8 sm:p-10 flex flex-col justify-between hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 transform hover:-translate-y-2 border border-transparent">
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
                <h3 className="text-4xl font-black text-dark group-hover:text-primary transition-colors duration-300">$9</h3>
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
                className="bg-primary hover:bg-[#C4531A] text-white font-bold w-full py-3.5 rounded-lg shadow-md transition-all duration-200 block text-center transform group-hover:scale-[1.02]"
                style={{ minHeight: '44px' }}
              >
                Get Started with Starter
              </Link>
            </div>
          </div>

          {/* GROWTH CARD (#1A1A1A bg) */}
          <div className="group bg-[#1A1A1A] text-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-white/5 p-8 sm:p-10 flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(232,98,26,0.15)] hover:border-primary/30 transition-all duration-500 transform hover:-translate-y-2">
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
                className="bg-white hover:bg-[#FDF0E8] text-primary font-bold w-full py-3.5 rounded-lg shadow-md transition-all duration-200 block text-center transform group-hover:scale-[1.02]"
                style={{ minHeight: '44px' }}
              >
                Upgrade to Growth
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Inverted Arch Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-10">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[45px] md:h-[65px] fill-[#1A1A1A]">
          <path d="M0,120 C400,20 800,20 1200,120 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
