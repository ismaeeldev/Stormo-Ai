'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function HomepageNavbar() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (isHome) {
      e.preventDefault();
      setMobileOpen(false);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        (scrolled || !isHome)
          ? 'bg-dark/95 border-b border-white/10 shadow-lg backdrop-blur-sm'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img 
                src="/stormo-logo.png" 
                alt="Stormo Logo" 
                className="h-12 sm:h-16 md:h-20 w-auto object-contain" 
                loading="eager"
                // @ts-ignore
                fetchpriority="high"
              />
            </Link>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href={isHome ? "#how-it-works" : "/how-it-works"}
              onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
              className="text-sm font-medium text-muted hover:text-white transition-colors"
            >
              How It Works
            </a>
            <a
              href={isHome ? "#pricing" : "/#pricing"}
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
            <Link
              href="/faq"
              className="text-sm font-medium text-muted hover:text-white transition-colors"
            >
              FAQ
            </Link>
          </div>

          {/* CTA Right */}
          <div className="hidden md:flex items-center gap-4">
            {status === 'loading' ? (
              <div className="h-10 w-28 bg-white/10 rounded-lg animate-pulse" />
            ) : status === 'authenticated' ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-muted hover:text-white transition-colors px-3 py-2 flex items-center gap-1.5"
                  title="Log Out"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
                <Link
                  href="/dashboard"
                  className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-all duration-200 shadow-md hover:shadow-primary/20 transform hover:-translate-y-0.5"
                  style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {/* Mobile Actions: Hamburger Only */}
          <div className="flex md:hidden items-center">
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

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setMobileOpen(false)}
          ></div>

          {/* Sidebar Panel */}
          <aside className="fixed top-0 right-0 bottom-0 w-64 bg-dark text-white shadow-2xl flex flex-col p-6 border-l border-white/10 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center">
                <img src="/stormo-logo.png" alt="Stormo" className="h-12 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-md text-muted hover:text-white hover:bg-white/5"
                aria-label="Close Menu"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-3">
              <a
                href={isHome ? "#how-it-works" : "/how-it-works"}
                onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
                className="block px-4 py-3 rounded-lg text-base font-medium text-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                How It Works
              </a>
              <a
                href={isHome ? "#pricing" : "/#pricing"}
                onClick={(e) => handleSmoothScroll(e, 'pricing')}
                className="block px-4 py-3 rounded-lg text-base font-medium text-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                Pricing
              </a>
              <Link
                href="/blog"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-base font-medium text-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/faq"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-base font-medium text-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                FAQ
              </Link>
              {status === 'loading' ? (
                <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
              ) : status === 'authenticated' ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-base font-medium text-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 rounded-lg text-base font-medium text-muted hover:text-white hover:bg-white/5 transition-colors"
                >
                  Log In
                </Link>
              )}
            </nav>

            <div className="pt-6 border-t border-white/10 mt-auto space-y-3">
              {status === 'loading' ? (
                <div className="h-10 w-full bg-white/5 rounded-lg animate-pulse" />
              ) : status === 'authenticated' ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="w-full bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg py-3 text-center transition-colors shadow-lg block"
                    style={{ minHeight: '44px' }}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted hover:text-white border border-white/10 hover:border-white/20 rounded-lg py-3 transition-colors"
                    style={{ minHeight: '44px' }}
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </>
              ) : (
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg py-3 text-center transition-colors shadow-lg block"
                  style={{ minHeight: '44px' }}
                >
                  Start for $9
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </nav>
  );
}
