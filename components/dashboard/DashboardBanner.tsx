'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, Trophy, ClipboardList } from 'lucide-react';
import Link from 'next/link';

interface ProgressData {
  totalActionsCompleted: number;
  totalSales: number;
  growthUnlocked: boolean;
  subscriptionTier: string;
  trialEndsAt: string | null;
  hasUnloggedAction: boolean;
}

interface BannerConfig {
  id: string;
  icon: React.ElementType;
  iconClass: string;
  barClass: string;
  bgClass: string;
  borderClass: string;
  message: React.ReactNode;
}

const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

function isDismissed(id: string): boolean {
  try {
    const raw = localStorage.getItem(`stormo_banner_${id}`);
    if (!raw) return false;
    return Date.now() - parseInt(raw, 10) < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function dismiss(id: string) {
  try {
    localStorage.setItem(`stormo_banner_${id}`, String(Date.now()));
  } catch {}
}

function resolveBanner(data: ProgressData): BannerConfig | null {
  // Priority 1 — Trial ending in < 3 days
  if (data.trialEndsAt) {
    const daysLeft = Math.ceil(
      (new Date(data.trialEndsAt).getTime() - Date.now()) / 86_400_000
    );
    if (daysLeft > 0 && daysLeft <= 3 && !isDismissed('trial-ending')) {
      return {
        id: 'trial-ending',
        icon: AlertTriangle,
        iconClass: 'text-amber-600',
        barClass: 'bg-amber-400',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        message: (
          <>
            Your $9 trial ends in{' '}
            <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong>.{' '}
            <Link href="/dashboard/settings" className="underline underline-offset-2 font-semibold">
              Continue for $29/month →
            </Link>
          </>
        ),
      };
    }
  }

  // Priority 2 — Growth unlocked, still on Starter
  if (data.growthUnlocked && data.subscriptionTier === 'starter' && !isDismissed('growth-available')) {
    return {
      id: 'growth-available',
      icon: Sparkles,
      iconClass: 'text-primary',
      barClass: 'bg-primary',
      bgClass: 'bg-orange-tint',
      borderClass: 'border-orange-200',
      message: (
        <>
          You have reached 10 sales!{' '}
          <Link href="/dashboard/settings" className="underline underline-offset-2 font-semibold">
            Upgrade to Growth to unlock advanced features →
          </Link>
        </>
      ),
    };
  }

  // Priority 3 — 8 sales (2 away from Growth unlock)
  if (data.totalSales === 8 && !isDismissed('eight-sales')) {
    return {
      id: 'eight-sales',
      icon: TrendingUp,
      iconClass: 'text-primary',
      barClass: 'bg-primary',
      bgClass: 'bg-orange-tint',
      borderClass: 'border-orange-200',
      message: <>You are 2 sales away from unlocking Growth! Keep going.</>,
    };
  }

  // Priority 4 — First sale logged
  if (data.totalSales === 1 && !isDismissed('first-sale')) {
    return {
      id: 'first-sale',
      icon: Trophy,
      iconClass: 'text-emerald-600',
      barClass: 'bg-emerald-500',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      message: <>Your first sale is logged! Keep this momentum going.</>,
    };
  }

  // Priority 5 — First action completed
  if (data.totalActionsCompleted === 1 && !isDismissed('first-action')) {
    return {
      id: 'first-action',
      icon: Trophy,
      iconClass: 'text-emerald-600',
      barClass: 'bg-emerald-500',
      bgClass: 'bg-emerald-50',
      borderClass: 'border-emerald-200',
      message: (
        <>
          You completed your first action! Great start.{' '}
          <Link href="/dashboard/history" className="underline underline-offset-2 font-semibold">
            Here is what to do next →
          </Link>
        </>
      ),
    };
  }

  // Priority 6 — Unlogged results reminder
  if (data.hasUnloggedAction && !isDismissed('log-results')) {
    return {
      id: 'log-results',
      icon: ClipboardList,
      iconClass: 'text-blue-600',
      barClass: 'bg-blue-500',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
      message: (
        <>
          You have an action from 2 days ago — log your results to help your AI improve.{' '}
          <Link href="/dashboard/history" className="underline underline-offset-2 font-semibold">
            Log results →
          </Link>
        </>
      ),
    };
  }

  return null;
}

export default function DashboardBanner() {
  const [banner, setBanner] = useState<BannerConfig | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/progress')
      .then((r) => r.json())
      .then((data: ProgressData) => {
        const resolved = resolveBanner(data);
        if (resolved) {
          setBanner(resolved);
          setVisible(true);
        }
      })
      .catch(() => {
        // Silently skip — banner is non-critical
      });
  }, []);

  if (!banner || !visible) return null;

  const Icon = banner.icon;

  return (
    <div
      className={`relative flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm overflow-hidden ${banner.bgClass} ${banner.borderClass}`}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${banner.barClass}`} />

      <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${banner.iconClass}`} />

      <p className="flex-1 text-dark leading-snug">{banner.message}</p>

      <button
        onClick={() => {
          dismiss(banner.id);
          setVisible(false);
        }}
        aria-label="Dismiss"
        className="flex-shrink-0 text-subtle hover:text-dark transition-colors cursor-pointer -mt-0.5"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
