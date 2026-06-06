'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Zap, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Show success message regardless of whether the email exists for security reasons
      setSubmitted(true);
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border-t-3 border-primary p-8">
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="flex items-center gap-2 mb-2">
            <Zap className="h-8 w-8 text-primary fill-primary" />
            <span className="text-2xl font-bold text-dark">Stormo.io</span>
          </Link>
          <h2 className="text-xl font-bold text-dark mt-2">Reset Password</h2>
          <p className="text-subtle text-sm text-center mt-1">
            {submitted
              ? "If this email exists, a reset link was sent"
              : "Enter your email address and we'll send you a link to reset your password"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-orange-tint border border-primary/20 text-dark text-sm rounded-lg text-center">
              We have sent a password reset link to <strong className="text-primary">{email}</strong>. Please check your inbox and spam folders.
            </div>
            <Link
              href="/login"
              className="w-full block text-center bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-6 py-3 transition-colors cursor-pointer"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-1.5 border-muted rounded-lg px-4 py-3 text-base text-dark bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-6 py-3 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
            
            <p className="text-center text-sm text-subtle mt-4">
              Remember your password?{' '}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
