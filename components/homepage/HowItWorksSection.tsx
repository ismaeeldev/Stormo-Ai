'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Define Niche & Store Platform',
      desc1: 'Connect your store platform and talk to Stormo during onboarding.',
      desc2: 'We build a tailored marketing foundation specific to your product catalog.',
    },
    {
      num: '02',
      title: 'Run Daily Marketing Actions',
      desc1: 'Receive one high-leverage marketing action in your dashboard every morning.',
      desc2: 'Spend 20 minutes copying generated templates and sending target outreach drafts.',
    },
    {
      num: '03',
      title: 'Track Sales & Achievements',
      desc1: 'Log your customer sales and monitor influencer CRM responses in real-time.',
      desc2: 'Earn milestone badges and unlock tier rewards as your store grows.',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 bg-[#F5F5F5] pb-24 sm:pb-32 md:pb-40 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">
            How It Works
          </h2>
          <p className="text-subtle text-base sm:text-lg mt-3">
            Go from zero traffic to consistent growth in three simple phases.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 md:gap-4 lg:gap-8">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              {/* Step Card */}
              <div className="group flex-1 bg-white rounded-xl shadow-md p-8 border-t-4 border-primary flex flex-col justify-between hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 transform hover:-translate-y-2">
                <div>
                  <span className="text-4xl sm:text-5xl font-black text-primary/20 group-hover:text-primary block mb-4 transition-colors duration-300">
                    {step.num}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-dark mb-3 group-hover:text-primary transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-subtle text-sm leading-relaxed">
                    {step.desc1} {step.desc2}
                  </p>
                </div>
              </div>

              {/* Connecting Arrow (Desktop Only) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center flex-shrink-0 text-primary/30">
                  <ArrowRight className="h-6 w-6 lg:h-8 lg:w-8 animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Centered Triangle Peak Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-10">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[30px] md:h-[40px] fill-white">
          <path d="M0,0 L580,90 C600,100 600,100 620,90 L1200,0 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
