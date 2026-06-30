'use client';

import { useEffect, useState } from 'react';
import { X, CalendarDays, TrendingUp, Flame, ShoppingBag } from 'lucide-react';

interface WeeklySummary {
  weekStart: string;
  title: string;
  actionsCompleted: number;
  resultsHighlight: string | null;
  channelFocus: string | null;
  streak: number;
  totalSales: number;
  growthUnlocked: boolean;
  weekLabel: string;
}

function salesProgress(totalSales: number, growthUnlocked: boolean): string {
  if (growthUnlocked) return 'Growth plan unlocked';
  const remaining = Math.max(0, 10 - totalSales);
  return `${totalSales} / 10 sales — ${remaining} to unlock Growth`;
}

export default function WeeklySummaryCard() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch('/api/weekly-summary')
      .then((r) => r.json())
      .then(({ summary: data }) => {
        if (!data) return;

        // Check if dismissed this week
        const key = `stormo_weekly_summary_${data.weekStart}_dismissed`;
        if (localStorage.getItem(key) === 'true') return;

        setSummary(data);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  function handleDismiss() {
    if (!summary) return;
    localStorage.setItem(`stormo_weekly_summary_${summary.weekStart}_dismissed`, 'true');
    setVisible(false);
  }

  if (!summary || !visible) return null;

  const channelLabel = summary.channelFocus
    ? summary.channelFocus.charAt(0).toUpperCase() + summary.channelFocus.slice(1)
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Accent bar */}
      <div className="h-[3px] bg-primary w-full" />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-subtle uppercase tracking-wider">Weekly Recap</p>
              <p className="text-sm font-semibold text-dark">{summary.weekLabel ?? summary.title}</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            className="text-subtle hover:text-dark transition-colors cursor-pointer flex-shrink-0 -mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-light-bg rounded-lg p-3 text-center border border-gray-100">
            <p className="text-2xl font-extrabold text-dark">{summary.actionsCompleted}</p>
            <p className="text-[11px] text-subtle mt-0.5">Actions done</p>
          </div>

          <div className="bg-light-bg rounded-lg p-3 text-center border border-gray-100">
            <div className="flex items-center justify-center gap-1">
              <Flame className="h-4 w-4 text-primary" />
              <p className="text-2xl font-extrabold text-dark">{summary.streak}</p>
            </div>
            <p className="text-[11px] text-subtle mt-0.5">Day streak</p>
          </div>

          <div className="bg-light-bg rounded-lg p-3 text-center border border-gray-100">
            <div className="flex items-center justify-center gap-1">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <p className="text-2xl font-extrabold text-dark">{summary.totalSales}</p>
            </div>
            <p className="text-[11px] text-subtle mt-0.5">Total sales</p>
          </div>

          {channelLabel && (
            <div className="bg-light-bg rounded-lg p-3 text-center border border-gray-100">
              <p className="text-sm font-bold text-primary truncate">{channelLabel}</p>
              <p className="text-[11px] text-subtle mt-0.5">Top channel</p>
            </div>
          )}
        </div>

        {/* Results highlight */}
        {summary.resultsHighlight && (
          <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800">{summary.resultsHighlight}</p>
          </div>
        )}

        {/* Sales progress */}
        <p className="text-xs text-subtle">
          {salesProgress(summary.totalSales, summary.growthUnlocked)}
        </p>
      </div>
    </div>
  );
}
