'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Pencil, Trash2, LogOut } from 'lucide-react';

type Coupon = {
  id: string;
  name: string;
  code: string;
  planType: string;
  maxRedemptions: number;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

function statusInfo(c: Coupon) {
  if (!c.isActive) return { label: 'Disabled', cls: 'bg-gray-100 text-gray-500' };
  if (c.expiresAt && new Date() > new Date(c.expiresAt)) return { label: 'Expired', cls: 'bg-red-50 text-red-500' };
  if (c.usedCount >= c.maxRedemptions) return { label: 'Full', cls: 'bg-orange-50 text-orange-500' };
  return { label: 'Active', cls: 'bg-green-50 text-green-600' };
}

export default function AdminCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin/coupons');
    if (res.status === 401) { router.push('/admin/login'); return; }
    setCoupons(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete coupon "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    setCoupons((c) => c.filter((x) => x.id !== id));
    setDeleting(null);
  }

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Top nav */}
      <div className="bg-[#1A1A1A] border-b border-white/5 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/stormo-logo.png" alt="Stormo" className="h-8 w-auto object-contain" />
            <span className="text-white/40 text-sm hidden sm:block">Admin</span>
            <span className="text-white/20 hidden sm:block">/</span>
            <span className="text-white font-semibold text-sm">Coupons</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-dark">Coupons</h1>
            <p className="text-sm text-subtle mt-0.5">Manage free-plan access codes</p>
          </div>
          <button
            onClick={() => router.push('/admin/coupons/new')}
            className="flex items-center gap-2 bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors shadow-lg hover:shadow-primary/25 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Coupon</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-16 text-center">
            <p className="text-subtle text-base mb-4">No coupons yet.</p>
            <button
              onClick={() => router.push('/admin/coupons/new')}
              className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-xl px-6 py-3 text-sm transition-colors cursor-pointer"
            >
              Create first coupon
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-3xl border border-gray-100/60 shadow-[0_12px_40px_rgba(0,0,0,0.03)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Name', 'Code', 'Plan', 'Used / Max', 'Expires', 'Status', ''].map((h) => (
                      <th key={h} className="px-5 py-4 text-left text-xs font-semibold text-subtle uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => {
                    const { label, cls } = statusInfo(c);
                    return (
                      <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-[#F5F5F5]/60 transition-colors">
                        <td className="px-5 py-4 font-medium text-dark">{c.name}</td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-primary bg-orange-tint px-2 py-0.5 rounded-lg text-xs font-bold tracking-wider">
                            {c.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${c.planType === 'growth' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                            {c.planType.charAt(0).toUpperCase() + c.planType.slice(1)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-dark">
                          <span className="font-semibold">{c.usedCount}</span>
                          <span className="text-subtle"> / {c.maxRedemptions}</span>
                        </td>
                        <td className={`px-5 py-4 ${c.expiresAt && new Date() > new Date(c.expiresAt) ? 'text-red-500' : 'text-subtle'}`}>
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${cls}`}>{label}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => router.push(`/admin/coupons/${c.id}/edit`)}
                              className="flex items-center gap-1.5 text-subtle hover:text-dark border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer"
                            >
                              <Pencil className="h-3 w-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.name)}
                              disabled={deleting === c.id}
                              className="flex items-center gap-1.5 text-red-400 hover:text-red-600 border border-red-100 hover:border-red-200 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                            >
                              {deleting === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {coupons.map((c) => {
                const { label, cls } = statusInfo(c);
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-100/60 shadow-[0_4px_16px_rgba(0,0,0,0.03)] p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-dark text-sm">{c.name}</p>
                        <span className="font-mono text-primary bg-orange-tint px-2 py-0.5 rounded-lg text-xs font-bold tracking-wider mt-1 inline-block">
                          {c.code}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${cls}`}>{label}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                      <div>
                        <p className="text-subtle mb-0.5">Plan</p>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${c.planType === 'growth' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {c.planType.charAt(0).toUpperCase() + c.planType.slice(1)}
                        </span>
                      </div>
                      <div>
                        <p className="text-subtle mb-0.5">Used</p>
                        <p className="font-semibold text-dark">{c.usedCount} / {c.maxRedemptions}</p>
                      </div>
                      <div>
                        <p className="text-subtle mb-0.5">Expires</p>
                        <p className={`font-medium ${c.expiresAt && new Date() > new Date(c.expiresAt) ? 'text-red-500' : 'text-dark'}`}>
                          {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/coupons/${c.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 rounded-xl py-2 text-xs font-medium text-subtle hover:text-dark transition-all cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deleting === c.id}
                        className="flex-1 flex items-center justify-center gap-1.5 border border-red-100 rounded-xl py-2 text-xs font-medium text-red-400 hover:text-red-600 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {deleting === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
