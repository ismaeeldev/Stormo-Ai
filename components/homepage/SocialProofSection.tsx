'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

export default function SocialProofSection() {
  const stats = [
    {
      value: '26M',
      label: 'Ecommerce Stores Worldwide',
      desc: 'The market is crowded, meaning standout daily actions are required to survive.',
    },
    {
      value: '90%',
      label: 'Store Failure Rate',
      desc: 'Most new stores close within 12 months due to inconsistent marketing habits.',
    },
    {
      value: '$1,500+',
      label: 'Monthly Agency Retainer',
      desc: 'Stormo automates these exact processes for less than the price of coffee.',
    },
  ];

  return (
    <section className="relative py-24 bg-[#1A1A1A] text-white text-center flex flex-col items-center pb-24 sm:pb-32 md:pb-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Testimonial Quote */}
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-primary fill-primary" />
            ))}
          </div>
          <blockquote className="text-xl sm:text-2xl font-light italic leading-relaxed text-white">
            "Stormo gave me a checklist I could actually complete before my morning coffee. I made my first organic sale on day 12."
          </blockquote>
          <cite className="block text-sm font-semibold tracking-wider uppercase text-primary">
            — Sarah M., Founder of CozyKnit
          </cite>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white/5 rounded-xl border-t-3 border-primary p-8 text-center flex flex-col justify-between hover:bg-white/10 transition-all duration-300"
            >
              <div>
                <p className="text-4xl sm:text-5xl font-black text-primary mb-3">
                  {stat.value}
                </p>
                <h3 className="font-bold text-base text-white mb-2">
                  {stat.label}
                </h3>
                <p className="text-[#AAAAAA] text-xs leading-relaxed">
                  {stat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="pt-8">
          <Link
            href="/pricing"
            className="bg-primary hover:bg-[#C4531A] text-white font-bold rounded-lg px-8 py-4 text-sm sm:text-base transition-all duration-300 shadow-xl hover:shadow-primary/30 transform hover:-translate-y-1 inline-flex items-center gap-2"
            style={{ minHeight: '52px' }}
          >
            Start For $9 — See It Work Before You Commit
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Slant Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-10">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[60px] fill-primary">
          <path d="M1200 120L0 120 0 0z" />
        </svg>
      </div>
    </section>
  );
}
