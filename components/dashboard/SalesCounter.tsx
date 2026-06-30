'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Loader2, Trophy, X, Sparkles, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';

const GROWTH_THRESHOLD = 10;
const CHANNELS = ['Instagram', 'TikTok', 'Email', 'Pinterest', 'Reddit', 'Other'];

interface SaleEntry {
  id: string;
  channel: string | null;
  notes: string | null;
  loggedAt: string;
}

export default function SalesCounter() {
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [recentSales, setRecentSales] = useState<SaleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [channel, setChannel] = useState('Instagram');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [growthUnlocked, setGrowthUnlocked] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const loadSales = async () => {
    try {
      const res = await fetch('/api/sales');
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const total = data.totalSales ?? 0;
      setTotalSales(total);
      setRecentSales(data.sales?.slice(0, 3) ?? []);
      if (data.growthUnlocked || total >= GROWTH_THRESHOLD) setGrowthUnlocked(true);
    } catch {
      setFetchError(true);
      setTotalSales(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadSales(); }, []);

  const handleLogSale = async () => {
    setIsSaving(true); setSaveError('');
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, notes: notes.trim() || null }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Error ${res.status}`); }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');

      const newTotal: number = data.totalSales;
      const wasUnlocked = growthUnlocked;
      setTotalSales(newTotal); setShowForm(false); setNotes(''); setChannel('Instagram');
      loadSales();

      if (data.growthUnlocked && !wasUnlocked) {
        setGrowthUnlocked(true); setJustUnlocked(true);
        confetti({ particleCount: 300, spread: 140, origin: { y: 0.5 }, colors: ['#E8621A', '#F97316', '#FBBF24', '#FFFFFF'] });
        setTimeout(() => confetti({ particleCount: 150, spread: 100, origin: { y: 0.4 }, colors: ['#E8621A', '#F97316', '#FDE68A'] }), 600);
      }
    } catch (e: any) {
      setSaveError(e.message || 'Failed to log sale. Try again.');
    } finally { setIsSaving(false); }
  };

  const resetForm = () => { setShowForm(false); setSaveError(''); setNotes(''); setChannel('Instagram'); };

  const safeTotal = totalSales ?? 0;
  const pct = Math.min((safeTotal / GROWTH_THRESHOLD) * 100, 100);
  const remaining = Math.max(GROWTH_THRESHOLD - safeTotal, 0);

  /* ── Skeleton ── */
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1 shimmer" />
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shimmer rounded-xl flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 shimmer rounded" />
              <div className="h-3 w-full shimmer rounded" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 py-2">
            <div className="h-12 w-20 shimmer rounded" />
            <div className="h-3 w-full shimmer rounded-full" />
            <div className="h-3 w-3/4 shimmer rounded" />
          </div>
          <div className="h-11 w-full shimmer rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Accent bar */}
      <div className="h-1 bg-primary w-full" />

      {/* Just-unlocked banner */}
      {justUnlocked && (
        <div className="relative bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 px-4 py-3 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-dark leading-snug">You Did It! 🎉</p>
            <p className="text-[10px] text-subtle mt-0.5">Check your email for Growth details.</p>
          </div>
          <button onClick={() => setJustUnlocked(false)} className="text-subtle hover:text-dark cursor-pointer flex-shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-orange-tint flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-dark">Sales Tracker</p>
            {growthUnlocked && (
              <span className="inline-flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold rounded-full px-2 py-0.5">
                <Trophy className="h-3 w-3" />
                Growth
              </span>
            )}
          </div>
          <p className="text-[11px] text-subtle mt-0.5 truncate">
            {growthUnlocked ? 'Growth plan is now available for you' : 'Log every sale · unlock Growth at 10'}
          </p>
        </div>
      </div>

      {/* Progress area */}
      <div className="px-5 pb-4 flex-1">
        {!growthUnlocked ? (
          <div className="space-y-3">
            {/* Big count */}
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-primary tabular-nums leading-none">{safeTotal}</span>
              <span className="text-lg font-bold text-subtle leading-none">/ {GROWTH_THRESHOLD}</span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2.5 rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-subtle mt-1.5 font-medium">
                {remaining > 0
                  ? `${remaining} more sale${remaining === 1 ? '' : 's'} to unlock Growth`
                  : 'Growth milestone reached!'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Count */}
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-primary tabular-nums leading-none">{safeTotal}</span>
              <span className="text-sm font-bold text-subtle leading-none">total sales</span>
            </div>

            {/* Upgrade prompt */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 space-y-2.5">
              <p className="text-xs font-bold text-dark">Growth plan is now available!</p>
              <a
                href="/dashboard/settings?upgrade=true"
                className="block w-full bg-primary hover:bg-[#C4531A] text-white font-bold rounded-lg py-2.5 text-xs text-center transition-all shadow-sm"
              >
                Upgrade to Growth — $39/month
              </a>
              <p className="text-[10px] text-subtle text-center">
                Need early access?{' '}
                <a href="mailto:info@stormo.io?subject=Early%20Growth%20Unlock%20Request" className="text-primary underline">
                  Contact support
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Log sale button (not in form mode) */}
      {!showForm && (
        <div className="px-5 pb-5">
          <button
            onClick={() => setShowForm(true)}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#C4531A] text-white font-bold rounded-xl py-3 text-sm transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {growthUnlocked ? 'Log Another Sale' : 'Log a Sale'}
          </button>
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="px-5 pb-5">
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-dark">Where did this sale come from?</p>
              <button onClick={resetForm} className="text-subtle hover:text-dark cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-subtle uppercase tracking-wider mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-subtle uppercase tracking-wider mb-1">
                Notes <span className="font-normal normal-case opacity-60">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. First customer from my reel"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {saveError && <p className="text-xs font-semibold text-red-600">{saveError}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleLogSale}
                disabled={isSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#C4531A] text-white font-bold rounded-lg py-2.5 text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isSaving ? 'Saving…' : 'Save Sale'}
              </button>
              <button onClick={resetForm} className="px-4 border border-gray-200 text-subtle font-semibold rounded-lg py-2.5 text-sm hover:bg-gray-50 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent sales */}
      {recentSales.length > 0 && (
        <div className="border-t border-gray-50 px-5 py-3.5 space-y-1.5">
          <p className="text-[10px] font-bold text-subtle uppercase tracking-wider mb-2">Recent</p>
          {recentSales.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="font-semibold text-dark capitalize">{s.channel || 'Direct'}</span>
                {s.notes && <span className="text-subtle truncate">· {s.notes}</span>}
              </div>
              <span className="text-subtle flex-shrink-0 text-[10px]">
                {new Date(s.loggedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {fetchError && (
        <p className="px-5 py-3 text-xs text-red-500 border-t border-gray-50">
          Could not load.{' '}<button onClick={loadSales} className="underline cursor-pointer">Retry</button>
        </p>
      )}
    </div>
  );
}
