'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  Zap,
  FileText,
  Users,
  Calendar,
  Trophy,
  Settings,
  Menu,
  X,
  MessageSquare,
  LogOut,
  User as UserIcon,
  BarChart2,
} from 'lucide-react';
import AskStormo from '@/components/dashboard/AskStormo';
import DashboardTour from '@/components/dashboard/DashboardTour';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { label: "Today's Action", href: '/dashboard', icon: Zap, tourId: 'tour-today' },
    { label: 'My Content', href: '/dashboard/content', icon: FileText, tourId: 'tour-content' },
    { label: 'Outreach', href: '/dashboard/outreach', icon: Users, tourId: 'tour-outreach' },
    { label: 'Campaigns', href: '/dashboard/campaigns', icon: Calendar, tourId: 'tour-campaigns' },
    { label: 'Milestones', href: '/dashboard/milestones', icon: Trophy, tourId: 'tour-milestones' },
    { label: 'Performance', href: '/dashboard/performance', icon: BarChart2 },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const user = session?.user;
  const subscriptionTier = user?.subscriptionTier || 'free';

  const isOnboarding = pathname === '/onboarding';

  if (isOnboarding) {
    return <div className="min-h-screen bg-light-bg">{children}</div>;
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            id={item.tourId}
            href={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-[#2E2E2E] text-white border-l-3 border-primary pl-3.5'
                : 'text-muted hover:text-white hover:bg-[#252525]'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted'}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-light-bg flex">
      {/* Desktop Sidebar (Fixed, 240px wide) */}
      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 bg-dark text-white border-r border-gray-800 flex-shrink-0">
        {/* Top Header Logo */}
        <div className="h-24 flex items-center px-6 border-b border-gray-800">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <img src="/stormo-logo.png" alt="Stormo Logo" className="h-20 w-auto object-contain" />
          </Link>
        </div>

        {/* Navigation Section */}
        <NavLinks />

        {/* Bottom User Info Section */}
        <div className="p-4 border-t border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || 'User Avatar'}
                className="h-10 w-10 rounded-full border border-gray-700 object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                {user?.name ? user.name[0].toUpperCase() : <UserIcon className="h-5 w-5" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-white">
                {user?.name || user?.email || 'User'}
              </p>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold text-primary bg-orange-tint rounded-full capitalize">
                {subscriptionTier}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 border border-gray-800 hover:bg-[#252525] text-muted hover:text-white rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          ></div>

          {/* Drawer menu */}
          <aside className="relative flex flex-col w-64 bg-dark text-white h-full shadow-2xl transition-transform duration-300">
            <div className="border-b border-gray-800 safe-top">
            <div className="h-16 flex items-center justify-center px-6 relative">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <img src="/stormo-logo.png" alt="Stormo Logo" className="h-13 w-auto object-contain" />
              </Link>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute right-4 p-1 rounded-md text-muted hover:text-white hover:bg-[#252525]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            </div>

            <NavLinks onClick={() => setIsMobileOpen(false)} />

            <div className="p-4 border-t border-gray-800 space-y-4">
              <div className="flex items-center gap-3">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="h-10 w-10 rounded-full border border-gray-700 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold">
                    {user?.name ? user.name[0].toUpperCase() : <UserIcon className="h-5 w-5" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate text-white">
                    {user?.name || user?.email || 'User'}
                  </p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold text-primary bg-orange-tint rounded-full capitalize">
                    {subscriptionTier}
                  </span>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 border border-gray-800 hover:bg-[#252525] text-muted hover:text-white rounded-lg px-4 py-2 text-xs transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar (Mobile Only) */}
        <header className="md:hidden border-b border-gray-800 bg-dark flex-shrink-0 safe-top">
          <div className="h-16 flex items-center justify-between px-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-md text-muted hover:text-white hover:bg-[#252525] transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <img src="/stormo-logo.png" alt="Stormo Logo" className="h-12 w-auto object-contain" />
            </Link>
            <div className="w-10" />
          </div>
        </header>

        {/* Nested Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Ask Stormo Floating Chat Widget */}
      <AskStormo />

      {/* First-visit guided product tour */}
      <DashboardTour />
    </div>
  );
}
