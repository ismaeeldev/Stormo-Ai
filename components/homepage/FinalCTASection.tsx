'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function FinalCTASection() {
  return (
    <section className="bg-primary py-24 px-4 text-center text-white relative overflow-hidden">
      {/* Decorative vector background */}
      <div className="absolute inset-0 pointer-events-none select-none opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 flex flex-col items-center">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-2xl">
          Your Store Deserves Customers
        </h2>
        <p className="text-white/90 text-base sm:text-lg md:text-xl font-light max-w-xl">
          Stop guessing, stop writing, and let AI build your daily organic marketing roadmap.
        </p>
        <div className="pt-4">
          <Link
            href="/pricing"
            className="bg-white hover:bg-orange-tint text-primary font-black text-base sm:text-lg px-8 py-4.5 rounded-lg shadow-2xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center gap-2"
            style={{ minHeight: '56px' }}
          >
            Start for $9
            <ArrowRight className="h-5 w-5 text-primary" />
          </Link>
        </div>
      </div>
    </section>
  );
}
