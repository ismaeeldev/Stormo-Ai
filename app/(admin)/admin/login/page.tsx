'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.push('/admin/coupons');
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-gray-100/60 overflow-hidden">
        {/* Dark header */}
        <div className="bg-[#1A1A1A] py-8 px-8 sm:px-10 flex flex-col items-center border-b border-white/5">
          <img src="/stormo-logo.png" alt="Stormo" className="h-14 w-auto object-contain mb-3" />
          <h1 className="text-white font-bold text-lg">Admin Panel</h1>
          <p className="text-white/50 text-sm mt-1 text-center">Sign in to manage coupons</p>
        </div>

        {/* Form */}
        <div className="p-8 sm:p-10">
          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-destructive text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder="admin"
                className="w-full border border-gray-200/80 rounded-xl px-4 py-3 text-base text-dark bg-white/50 placeholder-gray-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-200/80 rounded-xl px-4 py-3 pr-11 text-base text-dark bg-white/50 placeholder-gray-400 focus:bg-white focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 hover:text-dark transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl px-6 py-3.5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/25 mt-2"
            >
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
