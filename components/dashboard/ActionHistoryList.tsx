'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Calendar, Filter, ChevronDown } from 'lucide-react';

interface HistoryAction {
  id: string;
  title: string;
  channel: string;
  actionType: string;
  status: string;
  outcomeSignal: string | null;
  scheduledFor: string;
}

export default function ActionHistoryList() {
  const [items, setItems] = useState<HistoryAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  const fetchHistory = async (pageNumber: number, append = false) => {
    try {
      if (pageNumber === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      const query = new URLSearchParams({
        page: pageNumber.toString(),
        limit: '10',
        status: statusFilter,
        channel: channelFilter,
      });

      const res = await fetch(`/api/actions/history?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      
      const data: HistoryAction[] = await res.json();
      
      if (data.length < 10) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      if (append) {
        setItems((prev) => [...prev, ...data]);
      } else {
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchHistory(1, false);
  }, [statusFilter, channelFilter]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-0.5 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Completed</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">Pending</span>;
      case 'postponed':
        return <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full">Postponed</span>;
      case 'skipped':
        return <span className="px-2.5 py-0.5 text-xs font-semibold text-red-800 bg-red-100 rounded-full">Skipped</span>;
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 rounded-full capitalize">{status}</span>;
    }
  };

  // Predefined lists for dropdowns
  const channels = ['all', 'reddit', 'instagram', 'email', 'pinterest', 'seo', 'paid_ads'];
  const statuses = ['all', 'completed', 'pending', 'postponed', 'skipped'];

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-bold text-dark">Action History</h2>

        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-subtle" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-dark bg-transparent border-0 outline-none focus:ring-0 cursor-pointer capitalize"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  Status: {s}
                </option>
              ))}
            </select>
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-subtle" />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="text-xs font-semibold text-dark bg-transparent border-0 outline-none focus:ring-0 cursor-pointer capitalize"
            >
              {channels.map((c) => (
                <option key={c} value={c}>
                  Channel: {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-subtle text-sm">
            No historical actions found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-subtle uppercase tracking-wider">
                  <th className="p-4 md:px-6">Date</th>
                  <th className="p-4 md:px-6">Action Plan</th>
                  <th className="p-4 md:px-6">Channel</th>
                  <th className="p-4 md:px-6">Status</th>
                  <th className="p-4 md:px-6">Feedback / Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="p-4 md:px-6 text-subtle font-medium whitespace-nowrap">
                      {new Date(item.scheduledFor).toLocaleDateString()}
                    </td>
                    <td className="p-4 md:px-6 font-semibold text-dark max-w-xs md:max-w-md truncate" title={item.title}>
                      {item.title}
                    </td>
                    <td className="p-4 md:px-6">
                      <span className="px-2 py-0.5 text-xs font-bold text-primary bg-orange-tint rounded-full capitalize">
                        {item.channel}
                      </span>
                    </td>
                    <td className="p-4 md:px-6">{getStatusBadge(item.status)}</td>
                    <td className="p-4 md:px-6 text-subtle font-medium capitalize">
                      {item.outcomeSignal || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Load More */}
      {hasMore && !isLoading && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 border border-gray-200 bg-white hover:bg-orange-tint hover:border-primary text-dark font-semibold rounded-lg px-6 py-2.5 text-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading More...
              </>
            ) : (
              'Load More Actions'
            )}
          </button>
        </div>
      )}
    </div>
  );
}
