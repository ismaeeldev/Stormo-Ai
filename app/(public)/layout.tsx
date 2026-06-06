'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

import HomepageFooter from '@/components/homepage/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-black text-primary tracking-tight">Stormo<span className="text-dark">.io</span></span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/blog"
                className="text-sm font-medium text-subtle hover:text-primary transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-subtle hover:text-primary transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-subtle hover:text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-5 py-2 text-sm transition-colors shadow-sm"
                style={{ minHeight: '40px', display: 'inline-flex', alignItems: 'center' }}
              >
                Get Started
              </Link>
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-subtle hover:text-primary hover:bg-gray-100 focus:outline-none"
                style={{ minWidth: '44px', minHeight: '44px' }}
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 animate-in slide-in-from-top duration-200">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 rounded-md text-base font-medium text-subtle hover:text-primary hover:bg-gray-50"
              >
                Blog
              </Link>
              <Link
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 rounded-md text-base font-medium text-subtle hover:text-primary hover:bg-gray-50"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 rounded-md text-base font-medium text-subtle hover:text-primary hover:bg-gray-50"
              >
                Log In
              </Link>
              <div className="px-3 py-3">
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg py-3 text-center transition-colors shadow-sm block"
                  style={{ minHeight: '44px' }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <HomepageFooter />
    </div>
  );
}
