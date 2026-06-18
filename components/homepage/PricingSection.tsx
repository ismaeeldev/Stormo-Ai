'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Lock, Shield } from 'lucide-react';

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
    <section id="pricing" className="relative py-24 bg-[#F8F9FA] pb-24 sm:pb-32 md:pb-40 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-[#666666] text-base sm:text-lg mt-3">
            No long-term contracts, no setup fees. Choose the tier that matches your store volume.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* STARTER CARD */}
          <div className="group bg-white rounded-[2rem] border border-[#EBEBEB] p-8 sm:p-10 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative">
            <div>
              {/* Badge */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-[#FFF0EB] px-3.5 py-1.5 rounded-full">
                  Starter Tier
                </span>
              </div>

              {/* Pricing Block */}
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

              {/* Features list */}
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
              <Link
                href="/register?plan=starter"
                className="bg-primary hover:bg-[#D45214] text-white font-bold w-full py-4 rounded-2xl shadow-md transition-all duration-200 block text-center transform hover:scale-[1.01]"
              >
                Get Started with Starter
              </Link>
              <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-[#888888]">
                <Shield className="h-3.5 w-3.5" />
                <span>Cancel anytime. No contracts. No hidden fees.</span>
              </div>
            </div>
          </div>

          {/* GROWTH CARD */}
          <div className="group bg-[#0B0B0C] text-white rounded-[2rem] border border-white/5 p-8 sm:p-10 flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(232,98,26,0.15)] hover:border-primary/20 transition-all duration-300 relative">
            <div>
              {/* Badge & Lock Label */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A0A0A0] bg-[#1F1F21] px-3.5 py-1.5 rounded-full">
                  Growth Tier
                </span>
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary fill-primary/10" />
                  Available after 10 sales
                </span>
              </div>

              {/* Pricing Block */}
              <div className="mb-6">
                <span className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight">$39</span>
                <p className="text-[#888888] text-[10px] sm:text-xs font-bold tracking-wider uppercase mt-2">
                  Per month billing (billed automatically)
                </p>
              </div>

              <div className="py-5 border-t border-[#1F1F21] mb-6">
                <p className="text-sm text-[#A0A0A0] leading-relaxed invisible h-5">
                  {/* Empty spacer block to align cards vertically */}
                </p>
              </div>

              {/* Features list */}
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
              <button
                disabled
                className="bg-white text-primary font-bold w-full py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 cursor-not-allowed opacity-90"
              >
                <Lock className="h-4 w-4 text-primary" />
                Available after 10 sales
              </button>
            </div>
          </div>
        </div>

        {/* Footer info text */}
        <div className="mt-12 flex items-center justify-center gap-2 text-sm text-[#666666] font-semibold">
          <Shield className="h-4 w-4 text-primary" />
          <span>No contracts. No hidden fees. Cancel anytime.</span>
        </div>
      </div>
    </section>
  );
}
