'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

const SUBSCRIBED_KEY = 'stormo_push_subscribed';
const DISMISSED_KEY = 'stormo_push_dismissed';
const OPTED_OUT_KEY = 'stormo_push_opted_out';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output.buffer as ArrayBuffer;
}

export default function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');

  useEffect(() => {
    // Only show in supported browsers
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    // Already subscribed
    if (localStorage.getItem(SUBSCRIBED_KEY) === 'true') return;

    // User explicitly opted out from settings — respect their choice, don't re-prompt
    if (localStorage.getItem(OPTED_OUT_KEY) === 'true') return;

    // Already dismissed within 7 days
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_TTL_MS) return;

    // Permission already granted or denied at browser level — don't ask again
    if (Notification.permission === 'denied') return;
    if (Notification.permission === 'granted') {
      // They granted at browser level but we have no subscription — re-subscribe silently
      // (only if they have not explicitly opted out via settings)
      subscribeSilently();
      return;
    }

    setVisible(true);
  }, []);

  async function subscribeSilently() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch('/api/notifications/vapid-public-key');
      if (!res.ok) return;
      const { publicKey } = await res.json();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      localStorage.setItem(SUBSCRIBED_KEY, 'true');
    } catch {
      // Silent — non-critical
    }
  }

  async function handleEnable() {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        const res = await fetch('/api/notifications/vapid-public-key');
        if (!res.ok) throw new Error('VAPID key unavailable');
        const { publicKey } = await res.json();

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        });

        localStorage.setItem(SUBSCRIBED_KEY, 'true');
        setStatus('granted');
        setTimeout(() => setVisible(false), 2000);
      } else {
        setStatus('denied');
        setTimeout(() => setVisible(false), 2000);
      }
    } catch (err) {
      console.error('[Push] Subscribe failed:', err);
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 shadow-sm text-sm overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />

      <Bell className="h-4 w-4 text-primary flex-shrink-0" />

      {status === 'granted' ? (
        <p className="flex-1 text-dark font-medium">Notifications enabled! You will hear from us each morning.</p>
      ) : status === 'denied' ? (
        <p className="flex-1 text-subtle">Notifications blocked. You can enable them in your browser settings.</p>
      ) : (
        <>
          <p className="flex-1 text-dark">
            Get notified when your daily action is ready each morning.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="bg-primary hover:bg-[#C4531A] text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {loading ? 'Enabling…' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs text-subtle hover:text-dark transition-colors cursor-pointer whitespace-nowrap"
            >
              Maybe Later
            </button>
          </div>
        </>
      )}

      {status === 'idle' && (
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 text-subtle hover:text-dark transition-colors cursor-pointer ml-1"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
