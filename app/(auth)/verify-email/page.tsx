'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

type Status = 'verifying' | 'success' | 'error';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();

  const [status, setStatus] = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found. Please use the link from your email.');
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok) {
          setStatus('error');
          setErrorMsg(data.error || 'Verification failed.');
          return;
        }

        setStatus('success');
        // Refresh the session so emailVerified updates in the JWT
        await update();
        // Redirect to homepage after 3 seconds
        setTimeout(() => router.push('/'), 3000);
      } catch {
        setStatus('error');
        setErrorMsg('Something went wrong. Please try again.');
      }
    })();
  }, []);

  const handleResend = async () => {
    if (!resendEmail || resendStatus === 'loading') return;
    setResendStatus('loading');
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none select-none z-0" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-gray-100/60 overflow-hidden">

        {/* Dark Header */}
        <div className="bg-[#1A1A1A] py-8 px-8 flex flex-col items-center border-b border-white/5">
          <Link href="/">
            <img src="/stormo-logo.png" alt="Stormo" className="h-16 w-auto object-contain" />
          </Link>
        </div>

        <div className="p-8 text-center">

          {/* Verifying */}
          {status === 'verifying' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-dark mb-2">Verifying your email…</h1>
              <p className="text-sm text-subtle">This will only take a moment.</p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-dark mb-2">Email verified!</h1>
              <p className="text-sm text-subtle mb-6">
                Your account is now active. Redirecting you to the homepage in a moment…
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl px-8 py-3 text-sm transition-colors shadow-lg"
              >
                Go to Homepage
              </Link>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-5">
                <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <h1 className="text-xl font-bold text-dark mb-2">Verification failed</h1>
              <p className="text-sm text-subtle mb-6">{errorMsg}</p>

              {/* Resend form */}
              {resendStatus === 'sent' ? (
                <div className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  New link sent — check your inbox
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-dark bg-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 transition-all"
                  />
                  <button
                    onClick={handleResend}
                    disabled={!resendEmail || resendStatus === 'loading'}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {resendStatus === 'loading' ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <><RefreshCw className="h-4 w-4" /> Send new verification link</>
                    )}
                  </button>
                </div>
              )}

              <p className="mt-6 text-xs text-muted">
                <Link href="/login" className="text-primary hover:underline">Back to login</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
