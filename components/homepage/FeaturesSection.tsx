'use client';

import React from 'react';
import { Compass, PenTool, Target, Send, Calendar, Sparkles } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Compass,
      title: 'Stop Guessing',
      desc: 'Receive one high-leverage daily action structured specifically for your niche. Prevent decision fatigue and make compounding progress.',
    },
    {
      icon: PenTool,
      title: 'Stop Writing Content',
      desc: 'Get autopilot weekly social captions, blog outlines, outreach emails, and product copy generated based on your store profile details.',
    },
    {
      icon: Target,
      title: 'Ideal Customer Demographic',
      desc: 'Let our AI model analyze your products to outline target niches and customer pain points. Speak directly to the people who buy.',
    },
    {
      icon: Send,
      title: 'Influencer Outreach CRM',
      desc: 'Find micro-influencers, manage your outreach statuses, and copy custom pitch messages tailored to each influencer platform handle.',
    },
    {
      icon: Calendar,
      title: 'Never Miss an Opportunity',
      desc: 'Plan ahead with a dynamic 60-day campaign calendar showing upcoming holidays, and queue pre-event prep actions automatically.',
    },
    {
      icon: Sparkles,
      title: 'Graduate to Paid Ads',
      desc: 'Reach 10 sales organically to unlock Growth scaling features. Master organic funnels first, then scale up your budget with confidence.',
    },
  ];

  return (
    <section className="relative py-24 bg-white pb-24 sm:pb-32 md:pb-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">
            Features Built for Action
          </h2>
          <p className="text-subtle text-base sm:text-lg mt-3">
            Say goodbye to strategy guides. Stormo generates real assets and clear lists you can execute immediately.
          </p>
        </div>

        {/* Features 3x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group bg-white rounded-2xl shadow-md p-6 sm:p-8 border border-gray-200/60 flex flex-col items-start hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 transform hover:-translate-y-2"
              >
                <div className="bg-primary/10 group-hover:bg-primary p-3 rounded-lg w-fit mb-5 transition-all duration-300">
                  <Icon className="h-6 w-6 text-primary group-hover:text-white transition-all duration-300 transform group-hover:scale-110 group-hover:rotate-3" />
                </div>
                <h3 className="text-lg font-bold text-dark mb-2 group-hover:text-primary transition-colors duration-300">{feat.title}</h3>
                <p className="text-subtle text-sm leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Asymmetric Wave Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-10">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[60px] fill-[#F5F5F5]">
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,100 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
