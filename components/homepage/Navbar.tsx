'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function HomepageNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-dark/95 border-b border-white/10 shadow-lg backdrop-blur-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary tracking-tight">
                Stormo<span className="text-white">.io</span>
              </span>
            </Link>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
              className="text-sm font-medium text-muted hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, 'pricing')}
              className="text-sm font-medium text-muted hover:text-white transition-colors"
            >
              Pricing
            </a>
            <Link
              href="/blog"
              className="text-sm font-medium text-muted hover:text-white transition-colors"
            >
              Blog
            </Link>
          </div>

          {/* CTA Right */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted hover:text-white transition-colors px-3 py-2"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-all duration-200 shadow-md hover:shadow-primary/20 transform hover:-translate-y-0.5"
              style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
            >
              Start for $9
            </Link>
          </div>

          {/* Mobile Actions: CTA + Hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <Link
              href="/register"
              className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-4 py-2 text-xs transition-colors shadow-md"
              style={{ minHeight: '36px', display: 'inline-flex', alignItems: 'center' }}
            >
              Start for $9
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted hover:text-white focus:outline-none"
              style={{ minWidth: '40px', minHeight: '40px' }}
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-dark/95 border-b border-white/10 shadow-2xl backdrop-blur-md animate-in slide-in-from-top duration-200">
          <div className="px-2 pt-2 pb-6 space-y-1 sm:px-3">
            <a
              href="#how-it-works"
              onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
              className="block px-4 py-3 rounded-md text-base font-medium text-muted hover:text-white hover:bg-white/5"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={(e) => handleSmoothScroll(e, 'pricing')}
              className="block px-4 py-3 rounded-md text-base font-medium text-muted hover:text-white hover:bg-white/5"
            >
              Pricing
            </a>
            <Link
              href="/blog"
              className="block px-4 py-3 rounded-md text-base font-medium text-muted hover:text-white hover:bg-white/5"
            >
              Blog
            </Link>
            <Link
              href="/login"
              className="block px-4 py-3 rounded-md text-base font-medium text-muted hover:text-white hover:bg-white/5"
            >
              Log In
            </Link>
            <div className="px-4 pt-4">
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="w-full bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg py-3 text-center transition-colors shadow-lg block"
                style={{ minHeight: '44px' }}
              >
                Start for $9
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
