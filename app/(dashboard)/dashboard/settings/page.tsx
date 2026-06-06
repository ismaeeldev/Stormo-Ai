'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ArrowUpCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SettingsData {
  tier: string;
  totalSales: number;
  nextBillingDate: string | null;
  cancelAtPeriodEnd: boolean;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const fetchSettingsData = async () => {
    try {
      const res = await fetch('/api/user/settings');
      if (!res.ok) throw new Error('Failed to load settings data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'An error occurred loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    
    setError('');
    setCancelMessage('');
    setCancelLoading(true);

    try {
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to cancel subscription');

      const dateStr = json.cancelAt ? new Date(json.cancelAt).toLocaleDateString() : 'period end';
      setCancelMessage(`Your subscription ends on ${dateStr}. You keep access until then.`);
      
      // Refresh settings data to reflect updated cancelAtPeriodEnd status
      await fetchSettingsData();
    } catch (err: any) {
      setError(err.message || 'An error occurred during cancellation');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setError('');
    setUpgradeMessage('');
    setUpgradeLoading(true);

    try {
      const res = await fetch('/api/stripe/upgrade-to-growth', {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || 'Failed to upgrade subscription');

      setUpgradeMessage('Successfully upgraded to Growth plan!');
      await fetchSettingsData();
    } catch (err: any) {
      setError(err.message || 'An error occurred during upgrade');
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg text-center">
        <p className="text-destructive font-medium">{error || 'Failed to load settings'}</p>
      </div>
    );
  }

  const nextBillingDateFormatted = data.nextBillingDate
    ? new Date(data.nextBillingDate).toLocaleDateString()
    : 'N/A';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-dark">Settings</h1>
        <p className="text-subtle text-sm mt-1">Manage your account preferences and subscription plan</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-destructive text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Subscription Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border-t-3 border-primary p-6 md:p-8">
        <h2 className="text-xl font-bold text-dark mb-6">Subscription & Billing</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Current Tier Info */}
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-subtle uppercase tracking-wider">Current Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-dark capitalize">{data.tier} Plan</span>
                {data.tier !== 'free' && (
                  <span className="px-2.5 py-0.5 text-xs font-semibold text-primary bg-orange-tint rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>

            {data.tier !== 'free' && (
              <div>
                <p className="text-xs font-semibold text-subtle uppercase tracking-wider">
                  {data.cancelAtPeriodEnd ? 'Access Ends On' : 'Next Billing Date'}
                </p>
                <p className="text-lg font-medium text-dark mt-1">{nextBillingDateFormatted}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-subtle uppercase tracking-wider">Your Total Sales</p>
              <p className="text-lg font-medium text-dark mt-1">{data.totalSales} sales</p>
            </div>
          </div>

          {/* Action Explanations */}
          <div className="bg-light-bg rounded-lg p-6 flex flex-col justify-center border border-gray-200">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-dark text-sm">Security & Control</h3>
                <p className="text-subtle text-xs mt-1">
                  You have full control over your billing cycle. Cancel anytime to stop future renewals, or upgrade seamlessly when your store scales.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {cancelMessage && (
          <div className="mb-6 p-4 bg-orange-tint border border-primary/20 text-dark text-sm rounded-lg">
            {cancelMessage}
          </div>
        )}

        {upgradeMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg">
            {upgradeMessage}
          </div>
        )}

        {/* Buttons Section */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-gray-100">
          {/* Upgrade Button - Only show when totalSales >= 10 and they are not already growth */}
          {data.tier === 'starter' && data.totalSales >= 10 && (
            <button
              onClick={handleUpgrade}
              disabled={upgradeLoading || cancelLoading}
              className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-6 py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {upgradeLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="h-5 w-5" />
                  Upgrade to Growth Plan
                </>
              )}
            </button>
          )}

          {/* Cancel Button - Show only if subscribed and not already scheduled for cancellation */}
          {data.tier !== 'free' && !data.cancelAtPeriodEnd && (
            <button
              onClick={handleCancel}
              disabled={cancelLoading || upgradeLoading}
              className="bg-destructive hover:bg-red-700 text-white font-semibold rounded-lg px-6 py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Canceling Plan...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
