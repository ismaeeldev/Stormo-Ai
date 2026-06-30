'use client';

import { useEffect, useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

interface Insight {
  id: string;
  content: string;
  insightType: string | null;
  generatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  channel_tip: 'Channel Tip',
  audience_segment: 'Audience Insight',
  seasonal: 'Seasonal Opportunity',
  product_positioning: 'Positioning',
  retention_tip: 'Retention Tip',
  pricing_insight: 'Pricing Insight',
};

export default function InsightCard() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    fetch('/api/insights')
      .then((r) => r.json())
      .then(({ insight: data }) => {
        if (!data) return;
        setInsight(data);
        setVisible(true);
      })
      .catch(() => {});
  }, []);

  async function handleRead() {
    if (!insight || dismissing) return;
    setDismissing(true);
    try {
      await fetch('/api/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: insight.id }),
      });
      setVisible(false);
    } catch {
      setDismissing(false);
    }
  }

  if (!insight || !visible) return null;

  const typeLabel = insight.insightType ? (TYPE_LABELS[insight.insightType] ?? insight.insightType) : 'Insight';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-[3px] bg-amber-400 w-full" />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-subtle uppercase tracking-wider">AI Insight</p>
              <p className="text-xs font-semibold text-amber-700">{typeLabel}</p>
            </div>
          </div>

          <button
            onClick={handleRead}
            disabled={dismissing}
            aria-label="Mark as read"
            className="flex-shrink-0 text-subtle hover:text-dark transition-colors cursor-pointer disabled:opacity-50 -mt-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm text-dark leading-relaxed">{insight.content}</p>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-subtle">
            Generated {new Date(insight.generatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <button
            onClick={handleRead}
            disabled={dismissing}
            className="text-xs font-medium text-subtle hover:text-dark underline underline-offset-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {dismissing ? 'Marking…' : 'Mark as read'}
          </button>
        </div>
      </div>
    </div>
  );
}
