'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, AlertTriangle } from 'lucide-react';

const SUBSCRIBED_KEY = 'stormo_push_subscribed';
const OPTED_OUT_KEY = 'stormo_push_opted_out';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output.buffer as ArrayBuffer;
}

type State =
  | 'loading'
  | 'unsupported'   // browser doesn't support push
  | 'denied'        // browser permission permanently denied
  | 'enabled'       // subscribed + DB row exists
  | 'disabled';     // supported but not subscribed

export default function PushNotificationSettings() {
  const [state, setState] = useState<State>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setState('loading');
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      setState('unsupported');
      return;
    }

    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    try {
      // Check if we actually have a subscription in the browser
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        // Also verify the DB knows about it
        const res = await fetch('/api/notifications/subscribe');
        const { subscribed } = await res.json();
        setState(subscribed ? 'enabled' : 'disabled');
      } else {
        setState('disabled');
        // Clear stale localStorage flag if subscription was lost
        localStorage.removeItem(SUBSCRIBED_KEY);
      }
    } catch {
      setState('disabled');
    }
  }

  async function handleEnable() {
    setBusy(true);
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState('denied');
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch('/api/notifications/vapid-public-key');
      if (!keyRes.ok) throw new Error('VAPID key unavailable');
      const { publicKey } = await keyRes.json();

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const saveRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!saveRes.ok) throw new Error('Failed to save subscription');

      localStorage.setItem(SUBSCRIBED_KEY, 'true');
      localStorage.removeItem(OPTED_OUT_KEY);
      setState('enabled');
      setMessage('Push notifications enabled.');
    } catch (err: any) {
      setMessage(err?.message || 'Could not enable notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    setMessage('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Remove from server first
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        // Then unsubscribe in browser
        await sub.unsubscribe();
      }

      localStorage.removeItem(SUBSCRIBED_KEY);
      // Prevent the dashboard banner from silently re-subscribing on next visit
      localStorage.setItem(OPTED_OUT_KEY, 'true');
      setState('disabled');
      setMessage('Push notifications turned off.');
    } catch (err: any) {
      setMessage(err?.message || 'Could not turn off notifications. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="h-[3px] bg-primary w-full" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: icon + text */}
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              {state === 'enabled'
                ? <Bell className="h-4 w-4 text-primary" />
                : <BellOff className="h-4 w-4 text-subtle" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark">Push Notifications</p>
              <p className="text-xs text-subtle mt-0.5 leading-relaxed">
                {state === 'loading' && 'Checking status…'}
                {state === 'unsupported' && 'Your browser does not support push notifications.'}
                {state === 'denied' && 'Notifications are blocked. Enable them in your browser settings, then return here.'}
                {state === 'enabled' && 'You will be notified each morning when your daily action is ready.'}
                {state === 'disabled' && 'Get notified each morning when your daily action is ready.'}
              </p>
              {message && (
                <p className={`text-xs mt-1.5 font-medium ${message.includes('enabled') || message.includes('turned off') ? 'text-green-700' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Right: toggle / status */}
          <div className="flex-shrink-0 mt-0.5">
            {state === 'loading' && (
              <Loader2 className="h-5 w-5 text-subtle animate-spin" />
            )}

            {state === 'unsupported' && (
              <span className="text-xs text-subtle font-medium bg-gray-100 px-2.5 py-1 rounded-full">
                Not supported
              </span>
            )}

            {state === 'denied' && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                Blocked
              </span>
            )}

            {state === 'enabled' && (
              <button
                onClick={handleDisable}
                disabled={busy}
                className="text-xs font-semibold text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : 'Turn off'}
              </button>
            )}

            {state === 'disabled' && (
              <button
                onClick={handleEnable}
                disabled={busy}
                className="text-xs font-semibold text-white bg-primary hover:bg-[#C4531A] rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin inline" /> : 'Turn on'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
