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
          <div className="space-y-4 md:col-span-1 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 group">
              <img 
                src="/stormo-logo.png" 
                alt="Stormo Logo" 
                className="h-14 sm:h-16 w-auto object-contain" 
                loading="lazy"
              />
            </Link>
            <p className="text-subtle text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
              Momentum for your store. An always-on AI marketing manager giving you clear daily actions.
            </p>
          </div>

          {/* Product Links */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">FAQ</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="text-center md:text-left">
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="mailto:info@stormo.io" className="hover:text-primary transition-colors">Contact Us</a>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">Help &amp; FAQ</Link>
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
