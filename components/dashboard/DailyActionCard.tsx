'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, Clipboard, ClipboardCheck, Check, CalendarDays,
  AlertTriangle, Clock, Zap,
  Camera, Globe, Mail, Search, Users, Settings,
  ArrowRight,
} from 'lucide-react';

/* ── Constants ──────────────────────────────────────────────────────────── */

const LOADING_MSGS = [
  'Evaluating your marketing channel history...',
  'Checking for duplicate action patterns...',
  'Reviewing your niche and target audience...',
  'Selecting the highest-impact action for today...',
  'Preparing your copy template...',
];

const CHANNEL_CONFIG: Record<string, {
  Icon: React.ElementType;
  pill: string;
  dot: string;
}> = {
  instagram:  { Icon: Camera,      pill: 'bg-pink-50 text-pink-700 border border-pink-100',       dot: 'bg-pink-500'    },
  reddit:     { Icon: Globe,       pill: 'bg-orange-50 text-orange-700 border border-orange-100', dot: 'bg-orange-500'  },
  email:      { Icon: Mail,        pill: 'bg-blue-50 text-blue-700 border border-blue-100',        dot: 'bg-blue-500'    },
  seo:        { Icon: Search,      pill: 'bg-green-50 text-green-700 border border-green-100',     dot: 'bg-green-500'   },
  influencer: { Icon: Users,       pill: 'bg-purple-50 text-purple-700 border border-purple-100', dot: 'bg-purple-500'  },
  optimize:   { Icon: Settings,    pill: 'bg-gray-100 text-gray-600 border border-gray-200',       dot: 'bg-gray-500'    },
  planning:   { Icon: CalendarDays,pill: 'bg-blue-50 text-blue-700 border border-blue-100',        dot: 'bg-blue-500'    },
  paid_ads:   { Icon: Zap,         pill: 'bg-amber-50 text-amber-700 border border-amber-100',    dot: 'bg-amber-500'   },
};
const DEFAULT_CHANNEL = { Icon: Globe, pill: 'bg-orange-tint text-primary border border-orange-100', dot: 'bg-primary' };

const EFFORT_MAP: Record<string, string> = {
  community: '~25 min', content: '~35 min', outreach: '~45 min',
  seo: '~30 min', paid_ads: '~20 min',
};

const CATEGORY_MAP: Record<string, string> = {
  community: 'Community', content: 'Content', outreach: 'Outreach',
  seo: 'SEO', paid_ads: 'Paid Ads',
};

// One tip per day-of-week (0 = Sunday … 6 = Saturday)
const DAY_TIPS: { tip: string; cta: string; href: string }[] = [
  { tip: 'Rest and reflect — reviewing your week\'s wins keeps your momentum high.', cta: 'See your history', href: '/dashboard#history' },
  { tip: 'Log your results from this action. It helps Stormo pick even better actions tomorrow.', cta: 'Log results', href: '/dashboard#history' },
  { tip: 'Consistency beats intensity — showing up daily is your biggest advantage.', cta: 'View performance', href: '/dashboard/performance' },
  { tip: 'Check what\'s working across your channels. Your Performance tab has the answer.', cta: 'Open Performance', href: '/dashboard/performance' },
  { tip: 'Ask Stormo to brainstorm your next content batch or plan the rest of your week.', cta: 'Ask Stormo', href: '/dashboard' },
  { tip: 'Share your win — your audience notices when you show up consistently.', cta: 'See your history', href: '/dashboard#history' },
  { tip: 'Tomorrow\'s plan is already being prepared. Take a moment to log today\'s results.', cta: 'Log results', href: '/dashboard#history' },
];

/* ── Types ──────────────────────────────────────────────────────────────── */

interface Action {
  id: string;
  title: string;
  description: string;
  content: string;
  channel: string;
  actionType: string;
  status: string;
  scheduledFor: string;
  completedAt?: string | null;
}

/* ── Skeleton ────────────────────────────────────────────────────────────── */

function SkeletonCard({ msgIdx }: { msgIdx: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 shimmer rounded-full" />
          <div className="h-3.5 w-40 shimmer rounded" />
        </div>
        <div className="h-6 w-28 shimmer rounded-full" />
      </div>

      {/* Meta chips */}
      <div className="px-6 pt-5 flex flex-wrap gap-2">
        {[20, 16, 16, 22].map((w, i) => (
          <div key={i} className={`h-6 shimmer rounded-full`} style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      {/* Title + description */}
      <div className="px-6 pt-4 pb-0 space-y-3">
        <div className="h-7 w-4/5 shimmer rounded" />
        <div className="border-l-2 border-gray-100 pl-4 space-y-2 py-1">
          <div className="h-4 w-full shimmer rounded" />
          <div className="h-4 w-11/12 shimmer rounded" />
          <div className="h-4 w-3/4 shimmer rounded" />
        </div>
      </div>

      {/* Template box */}
      <div className="px-6 pt-5 pb-6">
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 shimmer rounded-full" />
              <div className="h-2.5 w-2.5 shimmer rounded-full" />
              <div className="h-2.5 w-2.5 shimmer rounded-full" />
            </div>
            <div className="h-3 w-16 shimmer rounded" />
          </div>
          <div className="p-5 space-y-2">
            {[1, 0.94, 1, 0.88, 1, 0.78, 0.91].map((w, i) => (
              <div key={i} className="h-3 shimmer rounded" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* AI bar */}
      <div className="border-t border-gray-100 px-6 py-3.5 flex items-center gap-3 bg-gray-50/50">
        <Loader2 className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
        <p className="text-sm text-subtle transition-all duration-500">{LOADING_MSGS[msgIdx]}</p>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export default function DailyActionCard() {
  const [action, setAction]               = useState<Action | null>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isCopied, setIsCopied]           = useState(false);
  const [loadingMsgIdx, setMsgIdx]        = useState(0);
  const [isCompleting, setCompleting]     = useState(false);
  const [error, setError]                 = useState('');
  const [completedTime, setCompletedTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading) { setMsgIdx(0); return; }
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(t);
  }, [isLoading]);

  const fetchTodayAction = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/actions/today');
      if (!res.ok) throw new Error('Failed to fetch action');
      const data = await res.json();
      if (!data) {
        generateAction();
      } else if (data.status === 'completed' || data.status === 'skipped') {
        // Today's work is already done — show "All caught up" without generating
        if (data.completedAt) setCompletedTime(new Date(data.completedAt));
        setAction(null);
        setIsLoading(false);
      } else {
        setAction(data);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred loading today's action.");
      setIsLoading(false);
    }
  };

  const generateAction = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/actions/generate', { method: 'POST' });
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Failed to generate'); }
      setAction(await res.json());
    } catch (err: any) {
      setError(err.message || "An error occurred generating today's action.");
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchTodayAction(); }, []);

  const handleCopy = async () => {
    if (!action?.content) return;
    try { await navigator.clipboard.writeText(action.content); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }
    catch {}
  };

  const handlePostpone = async () => {
    if (!action) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/actions/${action.id}/postpone`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to postpone');
      setAction(null);
      window.dispatchEvent(new CustomEvent('stormo:action-updated'));
      fetchTodayAction();
    } catch (err: any) { setError(err.message || 'Failed to postpone'); setIsLoading(false); }
  };

  const handleComplete = async () => {
    if (!action) return;
    setCompleting(true); setError('');
    try {
      const res = await fetch(`/api/actions/${action.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeSignal: null }),
      });
      if (!res.ok) throw new Error('Failed to complete action');
      window.dispatchEvent(new CustomEvent('stormo:action-completed', { detail: { actionId: action.id } }));
      setCompletedTime(new Date());
      setAction(null); // Shows "All caught up" immediately — no re-fetch needed
    } catch (err: any) { setError(err.message || 'Failed to complete action'); }
    finally { setCompleting(false); }
  };

  /* ── Derived ── */
  const channelCfg   = action ? (CHANNEL_CONFIG[action.channel] ?? DEFAULT_CHANNEL) : DEFAULT_CHANNEL;
  const ChannelIcon  = channelCfg.Icon;
  const effort       = action ? (EFFORT_MAP[action.actionType] ?? '~30 min') : '';
  const category     = action ? (CATEGORY_MAP[action.actionType] ?? action.actionType) : '';
  const scheduledStr = action
    ? new Date(action.scheduledFor).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : '';

  /* ── States ── */
  if (isLoading) return <SkeletonCard msgIdx={loadingMsgIdx} />;

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow p-10 flex flex-col items-center text-center gap-4 fade-up">
        <div className="h-12 w-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h3 className="font-bold text-dark">Generation paused</h3>
          <p className="text-subtle text-sm mt-1 max-w-sm">{error}</p>
        </div>
        <button onClick={fetchTodayAction} className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors cursor-pointer">
          Try Again
        </button>
      </div>
    );
  }

  if (!action) {
    const dayTip = DAY_TIPS[new Date().getDay()];
    const timeStr = completedTime
      ? completedTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : null;

    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow overflow-hidden flex flex-col fade-up min-h-[280px]">
        <div className="h-[3px] bg-green-500 w-full flex-shrink-0" />

        {/* Header */}
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <h2 className="text-[11px] font-black text-dark uppercase tracking-[0.14em]">
              Today's Action Plan
            </h2>
          </div>
          {timeStr && (
            <span className="text-[11px] font-semibold text-subtle bg-gray-50 border border-gray-100 rounded-full px-3 py-1 flex-shrink-0">
              Completed at {timeStr}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col px-6 lg:px-8 py-8 gap-6">
          {/* Success indicator */}
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-dark text-lg leading-tight">All caught up for today!</h3>
              <p className="text-subtle text-sm mt-0.5">Great work — your consistency is building real momentum.</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Day tip */}
          <div className="flex flex-col gap-3">
            <p className="text-[10px] font-bold text-subtle uppercase tracking-widest">While you wait for tomorrow</p>
            <p className="text-sm text-dark/90 leading-relaxed">{dayTip.tip}</p>
            <Link
              href={dayTip.href}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#C4531A] transition-colors self-start"
            >
              {dayTip.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow overflow-hidden flex flex-col fade-up">
        <div className="h-[3px] bg-primary w-full flex-shrink-0" />

        {/* ── Card header ── */}
        <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Live indicator */}
            <span className="relative flex h-2 w-2 flex-shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <h2 className="text-[11px] font-black text-dark uppercase tracking-[0.14em]">
              Today's Action Plan
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-subtle bg-gray-50 border border-gray-100 rounded-full px-3 py-1 flex-shrink-0">
            {scheduledStr}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="px-6 lg:px-8 pt-5 pb-6 flex-1 flex flex-col gap-5">

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${channelCfg.pill}`}>
              <ChannelIcon className="h-3 w-3" />
              {action.channel.charAt(0).toUpperCase() + action.channel.slice(1)}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-full text-[11px] font-semibold text-subtle capitalize">
              {category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-[11px] font-semibold text-subtle">
              <Clock className="h-3 w-3" />
              {effort}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-100 rounded-full text-[11px] font-bold text-primary">
              <Zap className="h-3 w-3" />
              High Priority
            </span>
          </div>

          {/* Title */}
          <h3 className="text-[1.3rem] font-extrabold text-dark leading-snug -mt-1">
            {action.title}
          </h3>

          {/* Description with left accent */}
          <div className="border-l-[3px] border-primary/25 pl-4 -mt-1">
            <p className="text-sm text-subtle leading-[1.75] whitespace-pre-wrap">
              {action.description}
            </p>
          </div>

          {/* Copy template — "editor" style */}
          {action.content && (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8F9FA] border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-[11px] w-[11px] rounded-full bg-red-400/90" />
                    <span className="h-[11px] w-[11px] rounded-full bg-yellow-400/90" />
                    <span className="h-[11px] w-[11px] rounded-full bg-green-400/90" />
                  </div>
                  <span className="text-[10px] font-bold text-subtle/80 uppercase tracking-[0.12em]">
                    Copy Template
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-[#C4531A] transition-colors cursor-pointer"
                >
                  {isCopied
                    ? <><ClipboardCheck className="h-3.5 w-3.5" /> Copied!</>
                    : <><Clipboard className="h-3.5 w-3.5" /> Copy all</>}
                </button>
              </div>

              {/* Content area */}
              <div className="bg-white p-5 max-h-56 overflow-y-auto">
                <ContentDisplay content={action.content} />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-3">
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#C4531A] active:scale-[0.98] text-white font-bold rounded-xl py-3 px-5 text-sm transition-all shadow-sm cursor-pointer disabled:opacity-70"
          >
            {isCompleting
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Check className="h-4 w-4" />
            }
            {isCompleting ? 'Completing…' : 'Mark Complete'}
          </button>
          <button
            onClick={handlePostpone}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-dark font-bold rounded-xl py-3 px-5 text-sm transition-all cursor-pointer"
          >
            <CalendarDays className="h-4 w-4 text-subtle" />
            Do Tomorrow
          </button>
        </div>
      </div>

    </>
  );
}

/* ── ContentDisplay ──────────────────────────────────────────────────────── */

function ContentDisplay({ content }: { content: string }) {
  const HEADER_RE = /^(Story\s+\d+|Subject|Hook|Caption|Headline|Section|Part|Day\s+\d+|Step\s+\d+|Option\s+\d+|Post\s+\d+|Email\s+\d+|Pin\s+\d+|Intro|Outro|CTA|Body|Opening|Closing)[:\s]/i;
  return (
    <div className="text-sm text-[#2D2D2D] leading-relaxed font-sans space-y-0.5">
      {content.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        if (HEADER_RE.test(line.trim()))
          return <p key={i} className="font-bold text-primary mt-3 first:mt-0 text-[13px]">{line}</p>;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}
