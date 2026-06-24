'use client';

import { useState, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check } from 'lucide-react';

const TOUR_KEY = 'stormo_tour_v1';
const PAD = 8;

interface Step {
  targetId: string;
  title: string;
  desc: string;
  side: 'right' | 'top' | 'center';
}

const STEPS: Step[] = [
  {
    targetId: '',
    title: 'Welcome to Stormo! 🎉',
    desc: "Your store is all set up. Let's take a 30-second tour so you know exactly where everything lives.",
    side: 'center',
  },
  {
    targetId: 'tour-today',
    title: "Today's Action",
    desc: 'The AI generates one focused marketing task for your store every single day. Complete it to build your streak.',
    side: 'right',
  },
  {
    targetId: 'tour-content',
    title: 'My Content',
    desc: 'Weekly AI-generated posts for Instagram, Reddit, Email, and more — ready to copy and publish in seconds.',
    side: 'right',
  },
  {
    targetId: 'tour-outreach',
    title: 'Outreach CRM',
    desc: 'Manage micro-influencer contacts, send AI-drafted messages, and track your follow-ups all in one place.',
    side: 'right',
  },
  {
    targetId: 'tour-campaigns',
    title: 'Campaign Calendar',
    desc: 'Your 60-day marketing opportunity queue — seasonal events, product launches, and promotion triggers.',
    side: 'right',
  },
  {
    targetId: 'tour-ask',
    title: 'Ask Stormo AI',
    desc: "Got a question about your store's marketing? The AI assistant is always here in the bottom corner — ask it anything.",
    side: 'top',
  },
];

export default function DashboardTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setActive(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (!active) return;
    const current = STEPS[step];
    if (!current.targetId) { setRect(null); return; }
    const el = document.getElementById(current.targetId);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    // Element not visible (e.g. mobile hidden sidebar) — fall back to center
    if (r.width === 0 || r.height === 0) { setRect(null); return; }
    setRect(r);
  }, [step, active]);

  function dismiss() {
    localStorage.setItem(TOUR_KEY, '1');
    setActive(false);
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }

  if (!mounted || !active) return null;

  const current = STEPS[step];
  const isCenter = !rect || current.side === 'center';
  const isLast = step === STEPS.length - 1;

  const spotlightStyle: CSSProperties | null = rect
    ? {
        position: 'fixed',
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: 10,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.78)',
        zIndex: 10000,
        pointerEvents: 'none',
        transition: 'all 0.25s ease',
      }
    : null;

  const tooltipStyle: CSSProperties = (() => {
    if (isCenter) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 340,
        zIndex: 10001,
      };
    }
    if (current.side === 'right' && rect) {
      return {
        position: 'fixed',
        left: rect.right + 20,
        top: Math.max(16, Math.min(rect.top + rect.height / 2 - 90, window.innerHeight - 220)),
        width: 292,
        zIndex: 10001,
      };
    }
    if (current.side === 'top' && rect) {
      return {
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 20,
        right: Math.max(16, window.innerWidth - rect.right),
        width: 292,
        zIndex: 10001,
      };
    }
    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 320,
      zIndex: 10001,
    };
  })();

  return createPortal(
    <>
      {/* Backdrop (center steps only — spotlight steps use box-shadow) */}
      {isCenter && (
        <div
          className="fixed inset-0 bg-black/78 z-[10000]"
          onClick={dismiss}
        />
      )}

      {/* Spotlight ring */}
      {spotlightStyle && <div style={spotlightStyle} />}

      {/* Tooltip card */}
      <div style={tooltipStyle}>
        {/* Arrow for right-side tooltips */}
        {!isCenter && current.side === 'right' && rect && (
          <div
            className="absolute -left-2 top-8 w-4 h-4 bg-white rotate-45 border-l border-b border-gray-100 shadow-sm"
            style={{ zIndex: -1 }}
          />
        )}

        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100/80 p-6 relative overflow-hidden">
          {/* Subtle orange accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-6 bg-primary'
                    : i < step
                    ? 'w-1.5 bg-primary/35'
                    : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
            <span className="ml-auto text-[10px] font-semibold text-subtle">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          <h3 className="font-bold text-dark text-[15px] mb-2 leading-snug">
            {current.title}
          </h3>
          <p className="text-subtle text-sm leading-relaxed mb-5">
            {current.desc}
          </p>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={dismiss}
              className="text-xs text-subtle hover:text-dark transition-colors cursor-pointer underline underline-offset-2"
            >
              Skip tour
            </button>
            <button
              onClick={next}
              className="bg-primary hover:bg-[#C4531A] text-white text-sm font-semibold rounded-xl px-5 py-2.5 flex items-center gap-1.5 transition-colors cursor-pointer shadow-md hover:shadow-primary/25"
            >
              {isLast ? (
                <><Check className="h-4 w-4" /> Done</>
              ) : (
                <>Next <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
