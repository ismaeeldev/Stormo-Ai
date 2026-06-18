'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [dots, setDots] = useState('');
  const attempts = useRef(0);

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const MAX = 25; // 50 seconds max

    async function check() {
      attempts.current += 1;

      try {
        const res = await fetch('/api/subscription-check');
        if (res.ok) {
          const data = await res.json();
          if (data.active) {
            setReady(true);
            setTimeout(() => router.push('/onboarding'), 2000);
            return;
          }
        }
      } catch {
        // network hiccup — keep retrying
      }

      if (attempts.current >= MAX) {
        // Webhook took too long — redirect to pricing so user can see their status
        router.push('/pricing?payment=pending');
        return;
      }

      setTimeout(check, 2000);
    }

    // First check after 3s — give Stripe webhook time to fire
    const t = setTimeout(check, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-white text-center gap-6">
      <img src="/stormo-logo.png" alt="Stormo" className="h-16 w-auto object-contain mb-2" />

      {ready ? (
        <>
          <div className="h-16 w-16 bg-green-500/10 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">You're in!</h1>
          <p className="text-white/50 text-sm">Setting up your dashboard…</p>
        </>
      ) : (
        <>
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold">Activating your account{dots}</h1>
          <p className="text-white/50 text-sm max-w-xs">
            Confirming your payment with Stripe. This takes a few seconds — don't close this tab.
          </p>
        </>
      )}
    </div>
  );
}
