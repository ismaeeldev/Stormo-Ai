'use client';

import { useState, useEffect } from 'react';
import {
  Clock, Zap, CalendarDays, Lightbulb, Tag, Check,
  Camera, Globe, Mail, Search, Users, Settings,
} from 'lucide-react';

interface Action {
  id: string;
  channel: string;
  actionType: string;
  scheduledFor: string;
}

const EFFORT_MAP: Record<string, string> = {
  community: '~25 min', content: '~35 min', outreach: '~45 min',
  seo: '~30 min', paid_ads: '~20 min',
};

const CATEGORY_MAP: Record<string, string> = {
  community: 'Community', content: 'Content', outreach: 'Outreach',
  seo: 'SEO', paid_ads: 'Paid Ads',
};

const NEXT_STEP_MAP: Record<string, string> = {
  community: 'Engage with 5 posts in your niche community before end of day.',
  content:   'Schedule your next post before the day ends to stay consistent.',
  outreach:  'Follow up with anyone who didn\'t respond within 48 hours.',
  seo:       'Check ranking changes in Google Search Console tomorrow.',
  paid_ads:  'Review spend vs. conversions before your next budget reload.',
};

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  instagram: Camera, reddit: Globe, email: Mail,
  seo: Search, influencer: Users, optimize: Settings,
  planning: CalendarDays, paid_ads: Zap,
};

export default function ActionContextPanel() {
  const [action, setAction]     = useState<Action | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/actions/today')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        // Treat completed/skipped as "all done" — show the done state, not the detail panel
        if (data?.status === 'completed' || data?.status === 'skipped') {
          setAction(null);
        } else {
          setAction(data ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // When the user completes or skips today's action, clear the panel immediately
  // without a second fetch — DailyActionCard already updated the DB.
  useEffect(() => {
    const handleDone = () => setAction(null);
    window.addEventListener('stormo:action-completed', handleDone);
    window.addEventListener('stormo:action-updated',   handleDone);
    return () => {
      window.removeEventListener('stormo:action-completed', handleDone);
      window.removeEventListener('stormo:action-updated',   handleDone);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 shimmer" />
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="h-3 w-28 shimmer rounded" />
        </div>
        <div className="px-5 py-3 space-y-0">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2.5">
              <div className="h-3 w-20 shimmer rounded" />
              <div className="h-3 w-16 shimmer rounded" />
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 pt-1">
          <div className="h-16 shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-up">
        <div className="h-1 bg-emerald-500 w-full" />
        <div className="p-5 flex flex-col items-center text-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-dark">All done today!</p>
            <p className="text-xs text-subtle mt-1 leading-relaxed">
              Today's action is complete. Your next plan will be ready tomorrow.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const key          = action.channel?.toLowerCase() ?? '';
  const ChannelIcon  = CHANNEL_ICONS[key] ?? Globe;
  const effort       = EFFORT_MAP[action.actionType]   ?? '~30 min';
  const category     = CATEGORY_MAP[action.actionType] ?? action.actionType;
  const nextStep     = NEXT_STEP_MAP[action.actionType] ?? 'Keep going — consistency compounds.';
  const channelLabel = action.channel.charAt(0).toUpperCase() + action.channel.slice(1);
  const scheduledStr = new Date(action.scheduledFor).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const rows: { Icon: React.ElementType; label: string; value: string }[] = [
    { Icon: ChannelIcon,   label: 'Channel',     value: channelLabel },
    { Icon: Tag,           label: 'Category',    value: category     },
    { Icon: Clock,         label: 'Est. Effort', value: effort       },
    { Icon: Zap,           label: 'Priority',    value: 'High'       },
    { Icon: CalendarDays,  label: 'Scheduled',   value: scheduledStr },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden fade-up">
      {/* Accent bar — distinct emerald so it differs from SalesCounter's orange */}
      <div className="h-1 bg-emerald-500 w-full" />

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100">
        <p className="text-[11px] font-black text-dark uppercase tracking-[0.14em]">Today's Focus</p>
      </div>

      {/* Rows */}
      <div className="px-5 py-1 divide-y divide-gray-50">
        {rows.map(({ Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Icon className="h-3.5 w-3.5 text-subtle flex-shrink-0" />
              <span className="text-xs text-subtle">{label}</span>
            </div>
            <span className="text-xs font-semibold text-dark text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Suggested next step */}
      <div className="px-5 pb-5 pt-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
              Suggested Next Step
            </p>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">{nextStep}</p>
        </div>
      </div>
    </div>
  );
}
