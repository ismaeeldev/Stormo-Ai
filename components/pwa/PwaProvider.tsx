'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function PwaProvider() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // ── Service Worker registration ──────────────────────────────────────────
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[Stormo SW] Registered, scope:', reg.scope);

          // Listen for SW updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New SW available — soft reload to activate it
                console.log('[Stormo SW] Update found — reloading...');
                window.location.reload();
              }
            });
          });
        })
        .catch((err) => console.error('[Stormo SW] Registration failed:', err));
    }

    // ── Detect standalone mode (already installed) ───────────────────────────
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) return; // already installed — nothing to prompt

    // ── iOS detection ────────────────────────────────────────────────────────
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(ios);

    if (ios) {
      // Show iOS install tip once per session after 4 s
      const dismissed = sessionStorage.getItem('stormo-ios-hint-dismissed');
      if (!dismissed) {
        const t = setTimeout(() => setShowBanner(true), 4000);
        return () => clearTimeout(t);
      }
      return;
    }

    // ── Android / Chrome install prompt ─────────────────────────────────────
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as InstallPromptEvent);
      const dismissed = sessionStorage.getItem('stormo-install-dismissed');
      if (!dismissed) setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    setShowBanner(false);
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[Stormo PWA] Installed.');
    }
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem(
      isIos ? 'stormo-ios-hint-dismissed' : 'stormo-install-dismissed',
      '1'
    );
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[300] p-4 pb-[max(16px,env(safe-area-inset-bottom))] sm:bottom-4 sm:left-auto sm:right-4 sm:p-0 sm:w-80"
      role="dialog"
      aria-label="Install Stormo app"
    >
      <div className="bg-[#1A1A1A] text-white rounded-2xl p-4 shadow-2xl border border-white/10 sm:rounded-2xl rounded-t-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
              <img src="/favicon.png" alt="Stormo" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="font-bold text-sm text-white leading-tight">Install Stormo</p>
              <p className="text-[11px] text-white/50 mt-0.5 leading-tight">
                {isIos ? 'Add to your home screen for the best experience' : 'Add Stormo to your home screen'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/70 p-1 flex-shrink-0 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* iOS instructions */}
        {isIos ? (
          <div className="space-y-2.5">
            <ol className="space-y-2">
              {[
                <>Tap the <Share className="inline h-3.5 w-3.5 text-primary align-text-bottom mx-0.5" /> <strong>Share</strong> button in Safari</>,
                <>Scroll down and tap <strong>"Add to Home Screen"</strong></>,
                <>Tap <strong>"Add"</strong> in the top-right corner</>,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/15 text-primary text-[10px] font-extrabold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-white/70 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-[10px] text-white/30 pt-1">
              Works on iPhone and iPad — Safari only.
            </p>
          </div>
        ) : (
          /* Android / Chrome install button */
          <button
            onClick={handleInstall}
            className="w-full bg-primary hover:bg-[#C4531A] active:scale-[0.97] text-white font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Add to Home Screen
          </button>
        )}
      </div>
    </div>
  );
}
