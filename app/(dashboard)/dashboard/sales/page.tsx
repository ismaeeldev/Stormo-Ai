import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { sales } from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import Link from 'next/link';
import { ShoppingBag, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Sales | Stormo.io',
  description: 'Your complete sales history.',
};

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function SalesPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const [salesRows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(sales)
      .where(eq(sales.userId, userId))
      .orderBy(desc(sales.loggedAt))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(sales)
      .where(eq(sales.userId, userId)),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-subtle hover:text-dark transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-orange-tint flex items-center justify-center flex-shrink-0">
          <ShoppingBag className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-dark tracking-tight">All Sales</h1>
          <p className="text-sm text-subtle">{total} sale{total !== 1 ? 's' : ''} logged</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow overflow-hidden">
        {salesRows.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingBag className="h-10 w-10 text-subtle mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-dark">No sales logged yet</p>
            <p className="text-xs text-subtle mt-1">Go back to the dashboard and log your first sale.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-subtle uppercase tracking-wider bg-gray-50/40">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Channel</th>
                  <th className="px-5 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {salesRows.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-subtle text-xs font-medium whitespace-nowrap">
                      {new Date(s.loggedAt ?? Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold text-primary bg-orange-tint border border-orange-100 rounded-full capitalize">
                        {s.channel || 'Direct'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-subtle text-sm max-w-xs truncate">
                      {s.notes || <span className="opacity-40">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-subtle">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/sales?page=${page - 1}`}
                  className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-primary hover:bg-orange-tint text-dark font-semibold rounded-lg px-3 py-1.5 text-xs transition-all"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/sales?page=${page + 1}`}
                  className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-primary hover:bg-orange-tint text-dark font-semibold rounded-lg px-3 py-1.5 text-xs transition-all"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
