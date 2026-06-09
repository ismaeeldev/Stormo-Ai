'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-[#1A1A1A] overflow-hidden text-center flex flex-col justify-center items-center pt-28 sm:pt-36 pb-24 sm:pb-32 md:pb-44 px-4">
      {/* Subtle Orange Geometric SVG Accent Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <svg
          className="absolute right-0 top-0 h-full w-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 1440 900"
        >
          {/* Polygons & Circles for abstract shapes */}
          <circle cx="200" cy="150" r="300" stroke="#E8621A" strokeWidth="2" />
          <circle cx="1200" cy="700" r="450" stroke="#E8621A" strokeWidth="2" />
          <polygon points="720,100 850,350 590,350" stroke="#E8621A" strokeWidth="2" />
          <polygon points="150,600 300,800 50,800" stroke="#E8621A" strokeWidth="2" />
          <line x1="0" y1="450" x2="1440" y2="450" stroke="#E8621A" strokeWidth="2" strokeDasharray="10 15" />
        </svg>
      </div>

      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none select-none z-0"></div>

      {/* Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-8 flex flex-col items-center">
        {/* Intro Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-xs font-semibold uppercase tracking-wider animate-bounce">
          <Sparkles className="h-4 w-4 text-primary" />
          AI-Powered Growth Engine
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-3xl">
          You Built The Store. <br />
          <span className="text-primary">Where Are The Customers?</span>
        </h1>

        {/* Subheadline */}
        <p className="text-[#AAAAAA] text-lg sm:text-xl md:text-2xl leading-relaxed max-w-2xl font-light">
          Stormo is your AI marketing manager — working beside you every single day.
        </p>

        {/* Supporting Line */}
        <div className="bg-white/5 border border-white/5 rounded-xl px-6 py-3 max-w-lg">
          <p className="text-white/80 text-sm sm:text-base font-medium">
            One action a day. Content written. Outreach managed. Campaigns planned.
          </p>
        </div>

        {/* Main CTA */}
        <div className="flex flex-col items-center gap-3 pt-4">
          <Link
            href="/register"
            className="bg-primary hover:bg-[#C4531A] text-white font-bold text-lg rounded-lg px-8 py-4.5 transition-all duration-300 shadow-xl hover:shadow-primary/30 transform hover:-translate-y-1 flex items-center justify-center gap-2"
            style={{ minHeight: '56px' }}
          >
            Start Getting Customers — First Month $9
            <ArrowRight className="h-5 w-5" />
          </Link>

          {/* Trust Subline */}
          <p className="text-[#666666] text-xs sm:text-sm font-medium tracking-wide">
            $9 first month. Then $29/month. Cancel anytime. Works with every store platform.
          </p>
        </div>
      </div>

      {/* Concave Arc Divider */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] transform translate-y-[1px] z-10">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[40px] md:h-[60px] fill-white">
          <path d="M0,0 C300,90 900,90 1200,0 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
