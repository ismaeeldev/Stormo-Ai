'use client';

import React from 'react';
import Link from 'next/link';

export default function HomepageFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-muted border-t-2 border-primary py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-12">
          {/* Logo & Tagline */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-black text-white tracking-tight">
                Stormo<span className="text-primary">.io</span>
              </span>
            </Link>
            <p className="text-subtle text-sm leading-relaxed max-w-xs">
              Momentum for your store. An always-on AI marketing manager giving you clear daily actions.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition-colors">Careers</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/help" className="hover:text-primary transition-colors">Help Center</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
              </li>
              <li>
                <Link href="/status" className="hover:text-primary transition-colors">System Status</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-subtle">
          <p>&copy; {currentYear} Stormo.io. All rights reserved.</p>
          <p>Built for new ecommerce founders seeking growth.</p>
        </div>
      </div>
    </footer>
  );
}
