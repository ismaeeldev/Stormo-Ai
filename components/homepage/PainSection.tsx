'use client';

import React from 'react';
import { X, Check } from 'lucide-react';

export default function PainSection() {
  const painPoints = [
    'Posting to nobody and wondering if it\'s working',
    'Afraid to spend on ads without knowing if they\'ll work',
    'Writing the same type of content over and over',
    'No idea which channels are worth your time',
    'Watching your store sit empty for months',
  ];

  const solutions = [
    'One specific action to take every single day',
    'Content written and ready to post',
    'Know exactly which channels are working for your niche',
    'Influencer outreach managed and followed up',
    'A plan that adapts as your store grows',
  ];

  return (
    <section className="relative py-24 bg-white pb-24 sm:pb-32 md:pb-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Headline */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-dark tracking-tight">
            Are You Experiencing This?
          </h2>
          <p className="text-subtle text-base sm:text-lg mt-3">
            Building the store is only 10% of the battle. The other 90% is getting customers.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Without Stormo Card */}
          <div className="group bg-white rounded-2xl shadow-md p-8 sm:p-10 border border-gray-200/60 flex flex-col justify-between hover:shadow-xl hover:shadow-primary/5 hover:border-gray-300 transition-all duration-500 transform hover:-translate-y-2">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-destructive bg-red-50 px-3 py-1 rounded-full">
                   Without Stormo
                </span>
              </div>
              <h3 className="text-xl font-bold text-dark mb-6">The Struggle of Solo Scaling</h3>
              <ul className="space-y-5">
                {painPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-subtle leading-relaxed">
                    <span className="bg-red-50 p-1 rounded-full flex-shrink-0 mt-0.5">
                      <X className="h-4 w-4 text-destructive" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* With Stormo Card */}
          <div className="group bg-orange-tint/50 rounded-2xl shadow-md p-8 sm:p-10 border border-primary/30 flex flex-col justify-between hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 transition-all duration-500 transform hover:-translate-y-2.5">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full">
                  With Stormo
                </span>
              </div>
              <h3 className="text-xl font-bold text-dark mb-6">Automated Clarity & Actions</h3>
              <ul className="space-y-5">
                {solutions.map((sol, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-dark font-medium leading-relaxed">
                    <span className="bg-primary/10 p-1 rounded-full flex-shrink-0 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </span>
                    {sol}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Slant Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-10">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[60px] fill-[#F5F5F5]">
          <path d="M1200 120L0 120 0 0z" />
        </svg>
      </div>
    </section>
  );
}
