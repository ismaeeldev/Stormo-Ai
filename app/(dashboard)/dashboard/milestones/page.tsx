'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Lock, CheckCircle2, Loader2, Sparkles, PlusCircle } from 'lucide-react';
import MilestoneConfetti from '@/components/dashboard/MilestoneConfetti';

interface MilestoneData {
  milestoneKey: string;
  achievedAt: string;
}

interface MilestoneDef {
  key: string;
  title: string;
  description: string;
}

const MILESTONE_DEFS: MilestoneDef[] = [
  {
    key: 'first_action',
    title: 'First Step Forward',
    description: 'Complete your first daily marketing action.',
  },
  {
    key: 'first_week',
    title: 'Consistency Builder',
    description: 'Maintain your marketing streak for 7 days.',
  },
  {
    key: 'first_content',
    title: 'Content Creator',
    description: 'View your first AI-generated content recommendation.',
  },
  {
    key: 'first_outreach',
    title: 'Outreach Explorer',
    description: 'Add your first contact to the Outreach CRM.',
  },
  {
    key: 'first_sale',
    title: 'First Dollar',
    description: "Report your first sale using Stormo's marketing.",
  },
  {
    key: 'ten_sales',
    title: 'Growth Engine',
    description: 'Report 10 sales to unlock the Growth tier.',
  },
  {
    key: 'thirty_days',
    title: 'One Month Strong',
    description: 'Stay active for 30 days.',
  },
  {
    key: 'ninety_days',
    title: 'Marketing Pro',
    description: 'Stay active for 90 days.',
  },
  {
    key: 'first_influencer_deal',
    title: 'Influencer Partner',
    description: 'Close your first influencer collaboration deal.',
  },
];

export default function MilestonesPage() {
  const [loading, setLoading] = useState(true);
  const [totalSales, setTotalSales] = useState(0);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [achievedMilestones, setAchievedMilestones] = useState<MilestoneData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saleAmount, setSaleAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/milestones');
      if (res.ok) {
        const data = await res.json();
        setTotalSales(data.totalSales || 0);
        setSubscriptionTier(data.subscriptionTier || 'free');
        setAchievedMilestones(data.achievedMilestones || []);
      }
    } catch (err) {
      console.error('Error fetching milestones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isAchieved = (key: string) => {
    return achievedMilestones.some((m) => {
      const dbKey = m.milestoneKey.toLowerCase();
      const queryKey = key.toLowerCase();
      return (
        dbKey === queryKey ||
        (queryKey === 'first_content' && dbKey === 'first_content_viewed') ||
        (queryKey === 'first_outreach' && dbKey === 'first_outreach_added')
      );
    });
  };

  const getAchievedDate = (key: string) => {
    const found = achievedMilestones.find((m) => {
      const dbKey = m.milestoneKey.toLowerCase();
      const queryKey = key.toLowerCase();
      return (
        dbKey === queryKey ||
        (queryKey === 'first_content' && dbKey === 'first_content_viewed') ||
        (queryKey === 'first_outreach' && dbKey === 'first_outreach_added')
      );
    });
    if (!found) return null;
    return new Date(found.achievedAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleReportSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/milestones/report-sale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: saleAmount }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to report sale');
      }

      // If they had 0 sales before, trigger confetti
      if (totalSales === 0) {
        localStorage.setItem('pendingConfetti', 'true');
        // Dispatch custom event to trigger MilestoneConfetti if active on this page layout
        window.dispatchEvent(new Event('storage'));
      }

      setIsModalOpen(false);
      setSaleAmount('');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      {/* MilestoneConfetti integration on the Milestones page itself to handle instant feedback */}
      <MilestoneConfetti />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">Your Progress</h1>
          <p className="text-subtle text-sm mt-1">Unlock marketing milestones and celebrate growth accomplishments</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-6 py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md select-none"
          style={{ minHeight: '44px' }}
        >
          <PlusCircle className="h-5 w-5" />
          Report a Sale
        </button>
      </div>

      {/* Growth Tier Upgrade Notification Card */}
      {totalSales >= 10 && subscriptionTier !== 'growth' && (
        <div className="bg-gradient-to-r from-primary to-[#ff7e36] text-white rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 border-b-4 border-[#C4531A] animate-pulse">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">10+ Sales Achieved! 🚀</h3>
              <p className="text-white/95 text-sm mt-1 max-w-xl">
                Congratulations on reaching this milestone! You have officially unlocked eligibility for the Growth tier.
                Upgrade today to access advanced automation and scaling tools.
              </p>
            </div>
          </div>
          <a
            href="/dashboard/settings"
            className="bg-white text-primary hover:bg-orange-tint font-bold px-6 py-3 rounded-lg shadow transition-colors flex-shrink-0 text-center"
            style={{ minHeight: '44px' }}
          >
            Upgrade to Growth
          </a>
        </div>
      )}

      {/* Sales Stats Summary */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-md flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-subtle uppercase tracking-wider">Store Success Metric</p>
          <h2 className="text-2xl font-bold text-dark mt-1">
            Total Sales Logged:{' '}
            <span className="text-primary font-black">{totalSales}</span>
          </h2>
        </div>
        <Trophy className="h-10 w-10 text-primary/10" />
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MILESTONE_DEFS.map((def) => {
          const achieved = isAchieved(def.key);
          const date = getAchievedDate(def.key);

          if (achieved) {
            return (
              <div
                key={def.key}
                className="bg-orange-tint rounded-xl shadow-md p-6 border-2 border-primary flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg min-h-[180px]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="bg-primary/15 p-2 rounded-lg">
                      <Trophy className="h-6 w-6 text-primary" />
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Unlocked
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-dark text-lg">{def.title}</h3>
                    <p className="text-subtle text-xs mt-1 leading-relaxed">{def.description}</p>
                  </div>
                </div>
                {date && (
                  <p className="text-primary font-medium text-xs mt-4 pt-3 border-t border-primary/10">
                    Achieved on {date}
                  </p>
                )}
              </div>
            );
          } else {
            return (
              <div
                key={def.key}
                className="bg-white rounded-xl shadow-md p-6 border border-gray-100 flex flex-col justify-between opacity-80 min-h-[180px]"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="bg-gray-100 p-2 rounded-lg">
                      <Lock className="h-6 w-6 text-subtle" />
                    </div>
                    <span className="text-xs font-semibold text-subtle bg-gray-100 px-2.5 py-1 rounded-full">
                      Locked
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark text-lg">{def.title}</h3>
                    <p className="text-subtle text-xs mt-1 leading-relaxed">{def.description}</p>
                  </div>
                </div>
                <div className="text-subtle text-xs mt-4 pt-3 border-t border-gray-100 italic">
                  How to unlock: Complete the requirement above
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Report a Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border-t-4 border-primary animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-dark mb-2">Report a Sale</h2>
              <p className="text-subtle text-sm mb-4">
                Log a new sale. This helps track your store's performance and unlocks new growth achievements.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-destructive text-sm rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleReportSale} className="space-y-4">
                <div>
                  <label htmlFor="sale-amount" className="block text-sm font-semibold text-dark mb-1">
                    Sale Amount (Optional)
                  </label>
                  <input
                    id="sale-amount"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 29.99"
                    value={saleAmount}
                    onChange={(e) => setSaleAmount(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    style={{ minHeight: '44px' }}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm font-semibold text-subtle hover:bg-gray-100 rounded-lg cursor-pointer"
                    style={{ minHeight: '44px' }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-[#C4531A] text-white font-semibold px-6 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    style={{ minHeight: '44px' }}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Log Sale'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
