'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Clipboard, ClipboardCheck, Check, CalendarDays, HelpCircle, X } from 'lucide-react';

interface Action {
  id: string;
  title: string;
  description: string;
  content: string;
  channel: string;
  actionType: string;
  status: string;
  scheduledFor: string;
}

export default function DailyActionCard() {
  const [action, setAction] = useState<Action | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchTodayAction = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/actions/today');
      if (!res.ok) throw new Error('Failed to fetch action');
      const data = await res.json();
      
      if (data) {
        setAction(data);
        setIsLoading(false);
      } else {
        // If no action exists for today, trigger generation automatically
        generateAction();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred loading today\'s action.');
      setIsLoading(false);
    }
  };

  const generateAction = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/actions/generate', {
        method: 'POST',
      });
      
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to generate action');
      }
      
      const data = await res.json();
      setAction(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred generating today\'s action.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAction();
  }, []);

  const handleCopy = async () => {
    if (!action?.content) return;
    try {
      await navigator.clipboard.writeText(action.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePostpone = async () => {
    if (!action) return;
    try {
      setIsLoading(true);
      const res = await fetch(`/api/actions/${action.id}/postpone`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Failed to postpone action');
      // Clear action state and show message or reloading
      setAction(null);
      fetchTodayAction();
    } catch (err: any) {
      setError(err.message || 'Failed to postpone action');
      setIsLoading(false);
    }
  };

  const handleCompleteSubmit = async (outcomeSignal: string) => {
    if (!action) return;
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/actions/${action.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomeSignal }),
      });

      if (!res.ok) throw new Error('Failed to complete action');

      setShowModal(false);
      setAction(null);
      // Reload page state or next action
      fetchTodayAction();
      window.location.reload(); // Force full reload to update parent stat numbers
    } catch (err: any) {
      setError(err.message || 'Failed to submit action outcome');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border-t-3 border-primary overflow-hidden min-h-[350px] flex flex-col justify-center items-center p-8 text-center space-y-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <div>
          <h3 className="font-bold text-dark text-lg">Loading daily action...</h3>
          <p className="text-subtle text-sm mt-1 max-w-sm">
            Evaluating e-commerce footprint, channel mappings, and historical contexts.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg border-t-3 border-primary p-8 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h3 className="font-bold text-dark text-lg">Action Generation Paused</h3>
        <p className="text-subtle text-sm max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchTodayAction}
          className="bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-4 py-2 text-sm transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="bg-white rounded-xl shadow-lg border-t-3 border-primary p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[300px]">
        <Check className="h-12 w-12 text-green-600 bg-green-50 p-2 rounded-full border border-green-200" />
        <h3 className="font-bold text-dark text-lg">All caught up for today!</h3>
        <p className="text-subtle text-sm max-w-sm">
          You have successfully completed or rescheduled all daily tasks. Check back tomorrow for your next customized growth plan.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border-t-3 border-primary overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-5 flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-lg font-bold text-dark">Today's Action Plan</h2>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 text-xs font-bold text-primary bg-orange-tint rounded-full uppercase tracking-wider">
              {action.channel}
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold text-subtle bg-gray-100 rounded-full capitalize">
              {action.actionType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-dark leading-tight">{action.title}</h3>
            <p className="text-sm text-subtle mt-1.5 whitespace-pre-wrap">{action.description}</p>
          </div>

          {action.content && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-dark uppercase tracking-wider">Generated Copy Template</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-[#C4531A] transition-colors cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <ClipboardCheck className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Clipboard className="h-4 w-4" />
                      Copy Template
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-[#2E2E2E] text-green-400 font-mono text-sm p-5 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 border border-gray-800">
                {action.content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="border-t border-gray-100 px-6 py-5 bg-gray-50/50 flex flex-wrap gap-4">
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 bg-primary hover:bg-[#C4531A] text-white font-semibold rounded-lg px-6 py-3.5 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md min-w-[150px]"
          >
            <Check className="h-5 w-5" />
            Mark Complete
          </button>
          <button
            onClick={handlePostpone}
            className="flex-1 border border-primary text-primary hover:bg-orange-tint font-semibold rounded-lg px-6 py-3.5 transition-all flex items-center justify-center gap-2 cursor-pointer min-w-[150px]"
          >
            <CalendarDays className="h-5 w-5" />
            Do This Tomorrow
          </button>
        </div>
      </div>

      {/* Outcome Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-primary">
                <HelpCircle className="h-6 w-6" />
                <h3 className="font-bold text-dark text-lg">How did it go?</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-subtle hover:text-dark p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-subtle">
              Help Stormo calibrate! Select the option that best describes the result or feedback from this daily action.
            </p>

            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Got Traffic', value: 'Got Traffic', desc: 'Acquired store views or clicks' },
                { label: 'Good Engagement', value: 'Good Engagement', desc: 'Received likes, comments, or emails' },
                { label: 'No Response', value: 'No Response', desc: 'Action completed but no feedback received' },
                { label: 'Too Difficult', value: 'Too Difficult', desc: 'Too time-consuming or complex to complete' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleCompleteSubmit(opt.value)}
                  disabled={isSubmitting}
                  className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-orange-tint transition-all cursor-pointer flex justify-between items-center disabled:opacity-50"
                >
                  <div>
                    <p className="font-semibold text-dark text-sm">{opt.label}</p>
                    <p className="text-xs text-subtle mt-0.5">{opt.desc}</p>
                  </div>
                  <Check className="h-5 w-5 text-primary opacity-0 hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Simple internal alert helper
function AlertTriangle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
