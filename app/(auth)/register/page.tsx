'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  React.useEffect(() => {
    document.title = "Create Account | Stormo.io";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (!terms) {
      setError('You must accept the terms and conditions');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, terms }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Automatically sign in the user after successful registration
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Registered successfully, but failed to auto-login. Please login manually.');
        router.push('/login');
      } else {
        router.push('/pricing');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/pricing' });
    } catch (err: any) {
      setError('Failed to login with Google.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none select-none z-0"></div>

      <div className="relative z-10 w-full max-w-md sm:max-w-xl bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-gray-100/60 overflow-hidden flex flex-col justify-between hover:shadow-[0_20px_50px_rgba(232,98,26,0.05)] hover:border-primary/10 transition-all duration-500">
        {/* Dark Top Header */}
        <div className="bg-[#1A1A1A] py-8 px-8 sm:px-10 flex flex-col items-center border-b border-white/5">
          <Link href="/" className="flex items-center gap-2.5 mb-3 group">
            <img src="/stormo-logo.png" alt="Stormo Logo" className="h-16 w-auto object-contain" />
          </Link>
          <p className="text-white/60 text-xs sm:text-sm text-center">Create your account to supercharge your SaaS marketing</p>
        </div>

        {/* White Form Body */}
        <div className="p-8 sm:p-10 bg-white flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1">Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200/80 rounded-xl px-4 py-3 text-base text-dark bg-white/50 placeholder-gray-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200/80 rounded-xl px-4 py-3 text-base text-dark bg-white/50 placeholder-gray-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200/80 rounded-xl pl-4 pr-10 py-3 text-base text-dark bg-white/50 placeholder-gray-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-dark cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              required
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-200 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-subtle cursor-pointer">
              I agree to the{' '}
              <Link href="/terms" className="text-primary hover:underline font-semibold">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline font-semibold">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl px-6 py-3.5 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/25"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-subtle">Or sign up with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 border border-gray-200/80 bg-white hover:bg-gray-50 text-dark font-semibold rounded-xl px-6 py-3.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.01c2.34-2.16 3.69-5.32 3.69-8.75Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.13c-1.11.75-2.53 1.19-3.95 1.19-3.05 0-5.64-2.06-6.57-4.83H1.31v3.23A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.43 14.32a7.18 7.18 0 0 1 0-2.64V8.45H1.31a12 12 0 0 0 0 7.1l4.12-3.23Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.96 11.96 0 0 0 12 0 12 12 0 0 0 1.31 8.45l4.12 3.23c.93-2.77 3.52-4.83 6.57-4.83Z"
              />
            </svg>
          )}
          Google
        </button>

        <p className="mt-6 text-center text-sm text-subtle">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Sign In
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
