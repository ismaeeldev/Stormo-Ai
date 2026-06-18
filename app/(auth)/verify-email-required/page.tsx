'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Mail, RefreshCw, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function VerifyEmailRequiredPage() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? '';

  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleResend = async () => {
    if (!email || resendStatus === 'loading') return;
    setResendStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to resend. Try again.');
        setResendStatus('error');
      } else {
        setResendStatus('sent');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setResendStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none select-none z-0" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-gray-100/60 overflow-hidden">

        {/* Dark Header */}
        <div className="bg-[#1A1A1A] py-8 px-8 flex flex-col items-center border-b border-white/5">
          <Link href="/" className="mb-3">
            <img src="/stormo-logo.png" alt="Stormo" className="h-16 w-auto object-contain" />
          </Link>
          <p className="text-white/50 text-xs text-center">Account created successfully</p>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>

          <h1 className="text-xl font-bold text-dark text-center mb-2">
            Check your inbox
          </h1>
          <p className="text-sm text-subtle text-center mb-1">
            We sent a verification link to
          </p>
          {email && (
            <p className="text-sm font-semibold text-dark text-center mb-6 break-all">
              {email}
            </p>
          )}

          <div className="bg-[#FDF0E8] rounded-xl p-4 mb-6 text-sm text-[#7A3A10] leading-relaxed">
            Click the link in that email to verify your account. After verification you'll be able to subscribe and access your dashboard.
          </div>

          {/* Resend section */}
          {resendStatus === 'sent' ? (
            <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium mb-4">
              <CheckCircle className="h-4 w-4" />
              Email resent — check your inbox again
            </div>
          ) : (
            <>
              {resendStatus === 'error' && (
                <p className="text-sm text-destructive text-center mb-3">{errorMsg}</p>
              )}
              <button
                onClick={handleResend}
                disabled={resendStatus === 'loading' || !email}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-primary/30 hover:bg-primary/5 text-dark font-medium rounded-xl py-3 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {resendStatus === 'loading' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><RefreshCw className="h-4 w-4" /> Resend verification email</>
                )}
              </button>
            </>
          )}

          <p className="mt-6 text-center text-xs text-muted">
            Wrong account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in with a different account
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6">
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 text-xs text-muted hover:text-dark transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
