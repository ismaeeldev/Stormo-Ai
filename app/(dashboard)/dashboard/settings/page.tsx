'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  ArrowDownCircle,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PushNotificationSettings from '@/components/dashboard/PushNotificationSettings';

interface SettingsData {
  tier: string;
  totalSales: number;
  nextBillingDate: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  growthUnlocked: boolean;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [downgradeMessage, setDowngradeMessage] = useState('');

  // null = closed, 'downgrade' | 'cancel' = which dialog is open
  const [dialog, setDialog] = useState<null | 'downgrade' | 'cancel'>(null);

  const fetchSettingsData = async () => {
    try {
      const res = await fetch('/api/user/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      setData(await res.json());
    } catch (err: any) {
      setError(err.message || 'An error occurred loading settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Settings & Subscription | Stormo.io';
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('upgraded') === 'true') {
        setUpgradeMessage('You are now on the Growth plan. Welcome to the next level!');
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    fetchSettingsData();
  }, []);

  const handleUpgrade = async () => {
    setError('');
    setUpgradeMessage('');
    setUpgradeLoading(true);
    try {
      const res = await fetch('/api/billing/upgrade', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upgrade failed');
      if (json.url) {
        window.location.href = json.url;
        return;
      }
      setUpgradeMessage('You are now on the Growth plan. Welcome to the next level!');
      await fetchSettingsData();
    } catch (err: any) {
      setError(err.message || 'An error occurred during upgrade');
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setError('');
    setDowngradeMessage('');
    setDowngradeLoading(true);
    try {
      const res = await fetch('/api/billing/downgrade', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Downgrade failed');
      const dateStr = json.effectiveDate
        ? new Date(json.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'your next renewal';
      setDowngradeMessage(`Downgrade scheduled. You will move to Starter on ${dateStr}.`);
      await fetchSettingsData();
    } catch (err: any) {
      setError(err.message || 'An error occurred during downgrade');
    } finally {
      setDowngradeLoading(false);
    }
  };

  const handleDialogConfirm = () => {
    const which = dialog;
    setDialog(null);
    if (which === 'downgrade') handleDowngrade();
    else if (which === 'cancel') handleCancel();
  };

  const handleCancel = async () => {
    setError('');
    setCancelMessage('');
    setCancelLoading(true);
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Cancellation failed');
      const dateStr = json.accessUntil
        ? new Date(json.accessUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'period end';
      setCancelMessage(`Subscription cancelled. You keep full access until ${dateStr}.`);
      await fetchSettingsData();
    } catch (err: any) {
      setError(err.message || 'An error occurred during cancellation');
    } finally {
      setCancelLoading(false);
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
      <div className="p-6 bg-white rounded-xl border border-gray-100 text-center">
        <p className="text-red-600 font-medium">{error || 'Failed to load settings'}</p>
      </div>
    );
  }

  const trialActive = !!(data.trialEndsAt && new Date(data.trialEndsAt) > new Date());
  const nextBillingFormatted = data.nextBillingDate
    ? new Date(data.nextBillingDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const trialEndsFormatted = data.trialEndsAt
    ? new Date(data.trialEndsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const isGrowth = data.tier === 'growth';
  const isStarter = data.tier === 'starter';
  const isFree = data.tier === 'free';
  const isPaid = !isFree;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Themed confirm dialogs — replaces browser confirm() */}
      <ConfirmDialog
        open={dialog === 'downgrade'}
        variant="downgrade"
        title="Downgrade to Starter?"
        message="You will keep Growth access until your next renewal date. After that, your plan reverts to Starter."
        confirmLabel="Yes, downgrade"
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'cancel'}
        variant="warning"
        title="Cancel your subscription?"
        message="You will keep full access to Stormo until your current billing period ends. You can reactivate any time."
        confirmLabel="Yes, cancel"
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog(null)}
      />

      <div>
        <h1 className="text-2xl font-bold text-dark">Settings</h1>
        <p className="text-subtle text-sm mt-0.5">Manage your account and subscription</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Subscription card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-[3px] bg-primary w-full" />

        <div className="p-6">
          <h2 className="text-base font-semibold text-dark mb-5">Subscription & Billing</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Current plan */}
            <div className="bg-light-bg rounded-lg p-4 border border-gray-100">
              <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">Current Plan</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-dark capitalize">{data.tier}</span>
                {isPaid && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-primary/10 text-primary rounded-full">
                    Active
                  </span>
                )}
                {isFree && trialActive && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                    Trial
                  </span>
                )}
              </div>
            </div>

            {/* Billing / trial date */}
            {(nextBillingFormatted || trialActive) && (
              <div className="bg-light-bg rounded-lg p-4 border border-gray-100">
                <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {data.cancelAtPeriodEnd ? 'Access Ends' : trialActive ? 'Trial Ends' : 'Next Billing'}
                </p>
                <p className="text-base font-medium text-dark">
                  {data.cancelAtPeriodEnd
                    ? (nextBillingFormatted ?? '—')
                    : trialActive
                    ? trialEndsFormatted
                    : (nextBillingFormatted ?? '—')}
                </p>
              </div>
            )}

            {/* Sales count */}
            <div className="bg-light-bg rounded-lg p-4 border border-gray-100">
              <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">Total Sales</p>
              <p className="text-xl font-bold text-dark">{data.totalSales}</p>
            </div>

            {/* Growth unlock status (for non-Growth users) */}
            {!isGrowth && (
              <div className="bg-light-bg rounded-lg p-4 border border-gray-100">
                <p className="text-xs font-semibold text-subtle uppercase tracking-wider mb-1.5">Growth Plan</p>
                {data.growthUnlocked ? (
                  <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Unlocked — ready to upgrade
                  </div>
                ) : (
                  <p className="text-sm text-subtle">{data.totalSales}/10 sales to unlock</p>
                )}
              </div>
            )}
          </div>

          {/* Status messages */}
          {upgradeMessage && (
            <div className="mb-4 p-3.5 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {upgradeMessage}
            </div>
          )}
          {downgradeMessage && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg">
              {downgradeMessage}
            </div>
          )}
          {cancelMessage && (
            <div className="mb-4 p-3.5 bg-orange-tint border border-primary/20 text-dark text-sm rounded-lg">
              {cancelMessage}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-5 border-t border-gray-100">
            {isStarter && data.growthUnlocked && !data.cancelAtPeriodEnd && (
              <button
                onClick={handleUpgrade}
                disabled={upgradeLoading || downgradeLoading || cancelLoading}
                className="inline-flex items-center gap-2 bg-primary hover:bg-[#C4531A] text-white text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {upgradeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {upgradeLoading ? 'Upgrading…' : 'Upgrade to Growth'}
              </button>
            )}

            {isGrowth && !data.cancelAtPeriodEnd && (
              <button
                onClick={() => setDialog('downgrade')}
                disabled={downgradeLoading || upgradeLoading || cancelLoading}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-dark text-sm font-medium rounded-lg px-5 py-2.5 border border-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {downgradeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowDownCircle className="h-4 w-4 text-subtle" />
                )}
                {downgradeLoading ? 'Scheduling…' : 'Downgrade to Starter'}
              </button>
            )}

            {isPaid && !data.cancelAtPeriodEnd && (
              <button
                onClick={() => setDialog('cancel')}
                disabled={cancelLoading || upgradeLoading || downgradeLoading}
                className="inline-flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg px-5 py-2.5 border border-red-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {cancelLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {cancelLoading ? 'Cancelling…' : 'Cancel Subscription'}
              </button>
            )}

            {data.cancelAtPeriodEnd && (
              <div className="flex items-center gap-2 text-sm text-subtle border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50">
                <Clock className="h-4 w-4" />
                Access continues until {nextBillingFormatted ?? 'period end'}
              </div>
            )}
          </div>

          {/* Support link for early Growth unlock */}
          {!data.growthUnlocked && !isGrowth && (
            <p className="mt-4 text-xs text-subtle">
              Already an experienced seller?{' '}
              <a href="mailto:support@stormo.io" className="text-primary underline underline-offset-2">
                Contact support to unlock Growth early.
              </a>
            </p>
          )}
        </div>
      </div>

      {/* ── Push notifications ────────────────────────────────────────────── */}
      <PushNotificationSettings />

      {/* ── Security card ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-[3px] bg-emerald-500 w-full" />
        <div className="p-5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-dark">Secure billing via Stripe</p>
            <p className="text-xs text-subtle mt-0.5">
              Your payment information is never stored on our servers. All billing is handled securely by Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
