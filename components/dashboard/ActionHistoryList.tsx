'use client';

import { useState, useEffect, Fragment } from 'react';
import { Loader2, Filter, RefreshCw, ChevronDown, ChevronUp, BarChart2, ClipboardList, Check, X } from 'lucide-react';

interface HistoryAction {
  id: string;
  title: string;
  channel: string;
  actionType: string;
  status: string;
  outcomeSignal: string | null;
  scheduledFor: string;
}

interface ResultsData {
  id: string;
  reach: number | null;
  engagement: number | null;
  followersGained: number | null;
  salesAttributed: number | null;
  clicksToStore: number | null;
  emailListAdditions: number | null;
  notes: string | null;
  loggedAt: string | null;
  updatedAt: string | null;
}

interface FormData {
  reach: string;
  engagement: string;
  followersGained: string;
  salesAttributed: string;
  clicksToStore: string;
  emailListAdditions: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  reach: '',
  engagement: '',
  followersGained: '',
  salesAttributed: '',
  clicksToStore: '',
  emailListAdditions: '',
  notes: '',
};

function resultsToForm(r: ResultsData | null): FormData {
  if (!r) return { ...EMPTY_FORM };
  return {
    reach: r.reach != null ? String(r.reach) : '',
    engagement: r.engagement != null ? String(r.engagement) : '',
    followersGained: r.followersGained != null ? String(r.followersGained) : '',
    salesAttributed: r.salesAttributed != null ? String(r.salesAttributed) : '',
    clicksToStore: r.clicksToStore != null ? String(r.clicksToStore) : '',
    emailListAdditions: r.emailListAdditions != null ? String(r.emailListAdditions) : '',
    notes: r.notes ?? '',
  };
}

export default function ActionHistoryList() {
  const [items, setItems] = useState<HistoryAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [resultsCache, setResultsCache] = useState<Record<string, ResultsData | null>>({});
  const [formState, setFormState] = useState<Record<string, FormData>>({});
  const [loadingResultsFor, setLoadingResultsFor] = useState<string | null>(null);
  const [savingFor, setSavingFor] = useState<string | null>(null);
  const [feedbackFor, setFeedbackFor] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const [changingStatusFor, setChangingStatusFor] = useState<string | null>(null);

  const fetchHistory = async (pageNumber: number, append = false, keepExpandedId?: string, silent = false) => {
    try {
      // Only show the full skeleton on the very first page load.
      // Refreshes triggered by events or the manual button use isRefreshing
      // so the table stays visible rather than flashing to skeleton.
      if (pageNumber === 1 && !silent) setIsLoading(true);
      else if (pageNumber > 1) setIsLoadingMore(true);

      const query = new URLSearchParams({
        page: pageNumber.toString(),
        limit: '10',
        status: statusFilter,
        channel: channelFilter,
      });

      const res = await fetch(`/api/actions/history?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch history');

      const data: HistoryAction[] = await res.json();
      setHasMore(data.length >= 10);

      if (append) {
        setItems((prev) => [...prev, ...data]);
      } else {
        setItems(data);
        // Preserve a pending auto-expand (e.g. just-completed action) instead of always resetting
        setExpandedRowId(keepExpandedId ?? null);
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

  useEffect(() => {
    const handler = () => {
      setIsRefreshing(true);
      setPage(1);
      fetchHistory(1, false, undefined, true).finally(() => setIsRefreshing(false));
    };
    window.addEventListener('stormo:action-updated', handler);
    return () => window.removeEventListener('stormo:action-updated', handler);
  }, [statusFilter, channelFilter]);

  // When an action is completed, refresh history and auto-expand that row
  useEffect(() => {
    const handler = (e: Event) => {
      const actionId = (e as CustomEvent<{ actionId: string }>).detail?.actionId;
      if (actionId) setJustCompletedId(actionId);
      setIsRefreshing(true);
      setPage(1);
      // Pass actionId so fetchHistory keeps that row expanded instead of resetting to null.
      // silent=true keeps the existing table visible rather than flashing skeleton.
      fetchHistory(1, false, actionId, true).finally(() => {
        setIsRefreshing(false);
        if (actionId) {
          // Pre-populate cache as null — results don't exist yet, shows the guide banner
          setResultsCache((prev) => ({ ...prev, [actionId]: null }));
          setFormState((prev) => ({ ...prev, [actionId]: { ...EMPTY_FORM } }));
        }
      });
    };
    window.addEventListener('stormo:action-completed', handler);
    return () => window.removeEventListener('stormo:action-completed', handler);
  }, [statusFilter, channelFilter]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setPage(1);
    await fetchHistory(1, false, undefined, true); // silent — keep table visible, spinner on button
    setIsRefreshing(false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchHistory(nextPage, true);
  };

  const handleRowClick = async (itemId: string) => {
    if (expandedRowId === itemId) {
      setExpandedRowId(null);
      return;
    }
    setExpandedRowId(itemId);

    if (!(itemId in resultsCache)) {
      setLoadingResultsFor(itemId);
      try {
        const res = await fetch(`/api/actions/${itemId}/results`);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        const results: ResultsData | null = data.results;
        setResultsCache((prev) => ({ ...prev, [itemId]: results }));
        setFormState((prev) => ({ ...prev, [itemId]: resultsToForm(results) }));
      } catch {
        setResultsCache((prev) => ({ ...prev, [itemId]: null }));
        setFormState((prev) => ({ ...prev, [itemId]: { ...EMPTY_FORM } }));
      } finally {
        setLoadingResultsFor(null);
      }
    }
  };

  const updateField = (actionId: string, field: keyof FormData, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [actionId]: { ...(prev[actionId] ?? EMPTY_FORM), [field]: value },
    }));
  };

  const handleSave = async (actionId: string) => {
    const form = formState[actionId] ?? EMPTY_FORM;
    setSavingFor(actionId);
    setFeedbackFor((prev) => {
      const next = { ...prev };
      delete next[actionId];
      return next;
    });

    try {
      const body: Record<string, any> = {};
      if (form.reach !== '') body.reach = Number(form.reach);
      if (form.engagement !== '') body.engagement = Number(form.engagement);
      if (form.followersGained !== '') body.followersGained = Number(form.followersGained);
      if (form.salesAttributed !== '') body.salesAttributed = Number(form.salesAttributed);
      if (form.clicksToStore !== '') body.clicksToStore = Number(form.clicksToStore);
      if (form.emailListAdditions !== '') body.emailListAdditions = Number(form.emailListAdditions);
      body.notes = form.notes || null;

      const res = await fetch(`/api/actions/${actionId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');

      setResultsCache((prev) => ({ ...prev, [actionId]: data.results }));
      setFeedbackFor((prev) => ({
        ...prev,
        [actionId]: { type: 'success', message: 'Results saved!' },
      }));

      setTimeout(() => {
        setFeedbackFor((prev) => {
          const next = { ...prev };
          delete next[actionId];
          return next;
        });
      }, 3000);
    } catch (e: any) {
      setFeedbackFor((prev) => ({
        ...prev,
        [actionId]: { type: 'error', message: e.message || 'Failed to save. Try again.' },
      }));
    } finally {
      setSavingFor(null);
    }
  };

  const handleStatusChange = async (actionId: string, newStatus: 'completed' | 'skipped') => {
    setChangingStatusFor(actionId);
    try {
      const endpoint = newStatus === 'completed'
        ? `/api/actions/${actionId}/complete`
        : `/api/actions/${actionId}/skip`;
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: newStatus === 'completed' ? JSON.stringify({ outcomeSignal: null }) : undefined,
      });
      if (!res.ok) throw new Error('Failed to update status');
      setItems((prev) =>
        prev.map((item) => item.id === actionId ? { ...item, status: newStatus } : item)
      );
    } catch (e: any) {
      setFeedbackFor((prev) => ({
        ...prev,
        [actionId]: { type: 'error', message: e.message || 'Failed to update status' },
      }));
    } finally {
      setChangingStatusFor(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full">
            Completed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full">
            Pending
          </span>
        );
      case 'postponed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-full">
            Postponed
          </span>
        );
      case 'skipped':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-full">
            Skipped
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-full capitalize">
            {status}
          </span>
        );
    }
  };

  const channels = ['all', 'reddit', 'instagram', 'email', 'pinterest', 'seo', 'paid_ads'];
  const statuses = ['all', 'completed', 'pending', 'postponed', 'skipped'];

  const renderResultsPanel = (item: HistoryAction) => {
    const isLoadingResults = loadingResultsFor === item.id;
    const form = formState[item.id] ?? EMPTY_FORM;
    const cached = resultsCache[item.id];
    const isSaving = savingFor === item.id;
    const feedback = feedbackFor[item.id];

    return (
      <tr key={`${item.id}-panel`}>
        <td colSpan={5} className="p-0 border-b border-gray-100">
          <div className="bg-orange-50/30 px-5 py-5 border-t border-orange-100">
            {isLoadingResults ? (
              <div className="flex items-center gap-2 text-sm text-subtle py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Loading saved results…</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status change controls for pending/postponed actions */}
                {(item.status === 'pending' || item.status === 'postponed') && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                    <span className="text-xs font-semibold text-subtle flex-shrink-0">Change status:</span>
                    <button
                      onClick={() => handleStatusChange(item.id, 'completed')}
                      disabled={changingStatusFor === item.id}
                      className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 font-semibold rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {changingStatusFor === item.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Mark Complete
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, 'skipped')}
                      disabled={changingStatusFor === item.id}
                      className="inline-flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 font-semibold rounded-lg px-3 py-1.5 text-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {changingStatusFor === item.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      Skip
                    </button>
                    {feedbackFor[item.id] && (
                      <span className={`text-xs font-semibold ${feedbackFor[item.id].type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                        {feedbackFor[item.id].message}
                      </span>
                    )}
                  </div>
                )}

                {/* Results form — only for completed actions */}
                {item.status === 'completed' && (
                  <>
                    {/* Guide banner — only shown when no results logged yet */}
                    {cached === null && (
                      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-orange-50 px-4 py-3.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <ClipboardList className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-dark">Log your results here</p>
                          <p className="text-xs text-subtle mt-0.5 leading-relaxed">
                            How many people did you reach? Any sales or clicks? Takes 30 seconds and helps Stormo pick better actions for you tomorrow.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-dark">Log Results</span>
                      </div>
                      {cached?.updatedAt && (
                        <span className="text-xs text-subtle">
                          Last updated {new Date(cached.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(
                        [
                          { key: 'reach', label: 'Reach' },
                          { key: 'engagement', label: 'Engagement' },
                          { key: 'followersGained', label: 'Followers Gained' },
                          { key: 'salesAttributed', label: 'Sales Attributed' },
                          { key: 'clicksToStore', label: 'Clicks to Store' },
                          { key: 'emailListAdditions', label: 'Email Signups' },
                        ] as { key: keyof FormData; label: string }[]
                      ).map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs font-semibold text-subtle mb-1">{label}</label>
                          <input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={form[key]}
                            onChange={(e) => updateField(item.id, key, e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-subtle mb-1">Notes</label>
                      <textarea
                        placeholder="e.g. Got two DMs from potential buyers, strong engagement on the first hour…"
                        value={form.notes}
                        onChange={(e) => updateField(item.id, 'notes', e.target.value)}
                        rows={2}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSave(item.id)}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-4 py-2 text-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {isSaving ? 'Saving…' : 'Save Results'}
                      </button>
                      {feedback && (
                        <span
                          className={`text-xs font-semibold ${
                            feedback.type === 'success' ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {feedback.message}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-subtle uppercase tracking-widest px-0.5">
        Action History
      </p>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* Card header with inline filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-dark">
            {statusFilter === 'all' && channelFilter === 'all'
              ? 'All actions'
              : `Filtered: ${statusFilter !== 'all' ? statusFilter : ''} ${channelFilter !== 'all' ? channelFilter : ''}`.trim()}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50/50">
              <Filter className="h-3.5 w-3.5 text-subtle flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold text-dark bg-transparent border-0 outline-none focus:ring-0 cursor-pointer capitalize"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'All status' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50/50">
              <Filter className="h-3.5 w-3.5 text-subtle flex-shrink-0" />
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="text-xs font-semibold text-dark bg-transparent border-0 outline-none focus:ring-0 cursor-pointer capitalize"
              >
                {channels.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All channels' : c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || isLoading}
              title="Refresh history"
              className="flex items-center justify-center h-8 w-8 border border-gray-200 rounded-lg bg-gray-50/50 hover:border-primary hover:bg-orange-tint transition-all cursor-pointer disabled:opacity-40"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-subtle ${isRefreshing ? 'animate-spin text-primary' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Table body */}
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-4 w-14 shimmer rounded flex-shrink-0" />
                <div className="h-4 flex-1 shimmer rounded max-w-xs" />
                <div className="h-5 w-20 shimmer rounded-full hidden sm:block flex-shrink-0" />
                <div className="h-5 w-20 shimmer rounded-full flex-shrink-0" />
                <div className="h-4 w-16 shimmer rounded ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-dark">No actions found</p>
            <p className="text-xs text-subtle mt-1">
              {statusFilter !== 'all' || channelFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Complete your first daily action to see history here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-subtle uppercase tracking-wider bg-gray-50/40">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3 hidden sm:table-cell">Channel</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Results</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {items.map((item) => (
                  <Fragment key={item.id}>
                    <tr
                      onClick={() => handleRowClick(item.id)}
                      className={`transition-colors cursor-pointer select-none ${
                        expandedRowId === item.id
                          ? 'bg-orange-50/40'
                          : 'hover:bg-gray-50/60'
                      }`}
                    >
                      <td className="px-5 py-3.5 text-subtle text-xs font-medium whitespace-nowrap">
                        {new Date(item.scheduledFor).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-dark max-w-[200px] md:max-w-sm">
                        <span className="line-clamp-2 text-sm leading-snug" title={item.title}>
                          {item.title}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="px-2 py-0.5 text-[10px] font-bold text-primary bg-orange-tint border border-orange-100 rounded-full capitalize">
                          {item.channel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(item.status)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-2">
                          {item.status === 'completed' && !item.outcomeSignal ? (
                            /* Pulsing badge guides user to log results */
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-primary bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
                              Log results
                            </span>
                          ) : (
                            <span className="text-subtle text-xs font-medium capitalize truncate max-w-[80px]">
                              {item.outcomeSignal || '—'}
                            </span>
                          )}
                          {expandedRowId === item.id ? (
                            <ChevronUp className="h-4 w-4 text-subtle flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-subtle flex-shrink-0" />
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRowId === item.id && renderResultsPanel(item)}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="flex justify-center px-5 py-4 border-t border-gray-100">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 border border-gray-200 hover:border-primary hover:bg-orange-tint text-dark font-semibold rounded-lg px-5 py-2 text-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Loading…
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
