'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [attempts, setAttempts] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If already showing active subscription from session, go immediately
    const tier = (session?.user as any)?.subscriptionTier;
    if (tier === 'starter' || tier === 'growth') {
      setReady(true);
      setTimeout(() => router.push('/onboarding'), 1500);
      return;
    }

    // Poll: refresh session every 2s until DB is updated (max 20 attempts = 40s)
    const interval = setInterval(async () => {
      setAttempts((n) => {
        if (n >= 20) {
          clearInterval(interval);
          // Give up polling — send to onboarding anyway, proxy will show correct state
          router.push('/onboarding');
        }
        return n + 1;
      });

      try {
        await update(); // re-fetches user from DB via JWT callback
        const refreshed = (session?.user as any)?.subscriptionTier;
        if (refreshed === 'starter' || refreshed === 'growth') {
          clearInterval(interval);
          setReady(true);
          setTimeout(() => router.push('/onboarding'), 1500);
        }
      } catch {
        // silent
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center p-6 text-white text-center gap-6">
      <img src="/stormo-logo.png" alt="Stormo" className="h-16 w-auto object-contain mb-2" />

      {ready ? (
        <>
          <div className="h-16 w-16 bg-green-500/10 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold">You're in!</h1>
          <p className="text-white/50 text-sm">Taking you to your dashboard…</p>
        </>
      ) : (
        <>
          <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h1 className="text-2xl font-bold">Setting up your account…</h1>
          <p className="text-white/50 text-sm">This takes just a moment. Don't close this tab.</p>
        </>
      )}
    </div>
  );
}
