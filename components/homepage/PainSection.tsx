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
    <section className="py-24 bg-white">
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
          <div className="bg-white rounded-xl shadow-md p-8 sm:p-10 border border-gray-150 flex flex-col justify-between hover:shadow-lg transition-shadow">
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
          <div className="bg-orange-tint rounded-xl shadow-md p-8 sm:p-10 border-2 border-primary flex flex-col justify-between hover:shadow-lg transition-all transform hover:-translate-y-1">
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
    </section>
  );
}
