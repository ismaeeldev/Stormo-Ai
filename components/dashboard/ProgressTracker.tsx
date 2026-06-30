'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Flame, ShoppingBag, Calendar, TrendingUp } from 'lucide-react';

interface ProgressData {
  totalActionsCompleted: number;
  currentStreak: number;
  totalSales: number;
  daysAsMember: number;
  mostUsedChannel: string | null;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub?: string;
  bar: string;   // tailwind bg class for top accent bar
  iconBg: string;
  iconColor: string;
}

function StatCard({ icon, value, label, sub, bar, iconBg }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 fade-up group">
      {/* Accent top bar */}
      <div className={`h-1 w-full ${bar}`} />
      <div className="px-4 py-4 sm:px-5 sm:py-5 flex flex-col">
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <p className="text-2xl sm:text-3xl font-black text-dark tabular-nums leading-none">
          {value}
        </p>
        <p className="text-[11px] font-bold text-subtle uppercase tracking-wider mt-2 leading-none">
          {label}
        </p>
        {sub && (
          <p className="text-[10px] text-subtle/80 mt-1.5 leading-snug line-clamp-2">{sub}</p>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-1 shimmer w-full" />
      <div className="px-5 py-5 flex flex-col gap-0">
        <div className="h-9 w-9 shimmer rounded-xl mb-3" />
        <div className="h-8 w-12 shimmer rounded" />
        <div className="h-2.5 w-24 shimmer rounded mt-2" />
        <div className="h-2 w-20 shimmer rounded mt-1.5" />
      </div>
    </div>
  );
}

export default function ProgressTracker() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/progress')
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d: ProgressData) => setData(d))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 text-sm text-subtle">
        Could not load performance data.
      </div>
    );
  }

  const channel = data.mostUsedChannel
    ? data.mostUsedChannel.charAt(0).toUpperCase() + data.mostUsedChannel.slice(1)
    : '—';

  const cards: StatCardProps[] = [
    {
      icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
      value: String(data.totalActionsCompleted),
      label: 'Actions Done',
      sub: data.totalActionsCompleted === 0 ? 'Complete your first action today' : `${data.totalActionsCompleted} actions total`,
      bar: 'bg-primary',
      iconBg: 'bg-orange-50',
      iconColor: 'text-primary',
    },
    {
      icon: <Flame className="h-4 w-4 text-orange-500" />,
      value: String(data.currentStreak),
      label: 'Day Streak',
      sub: data.currentStreak === 0 ? 'Start your streak today' : `${data.currentStreak} days in a row`,
      bar: 'bg-orange-400',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      icon: <ShoppingBag className="h-4 w-4 text-primary" />,
      value: String(data.totalSales),
      label: 'Sales Logged',
      sub: data.totalSales >= 10 ? 'Growth plan unlocked!' : `${10 - data.totalSales} more to unlock Growth`,
      bar: 'bg-primary',
      iconBg: 'bg-orange-50',
      iconColor: 'text-primary',
    },
    {
      icon: <Calendar className="h-4 w-4 text-blue-500" />,
      value: String(data.daysAsMember),
      label: 'Days Active',
      sub: `Day ${data.daysAsMember} of your journey`,
      bar: 'bg-blue-500',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
      value: channel,
      label: 'Top Channel',
      sub: data.mostUsedChannel ? 'Your most-used channel' : 'Complete more actions',
      bar: 'bg-emerald-500',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {cards.map((c) => <StatCard key={c.label} {...c} />)}
    </div>
  );
}
