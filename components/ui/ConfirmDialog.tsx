'use client';

import { useEffect } from 'react';
import { AlertTriangle, ArrowDownCircle, Trash2 } from 'lucide-react';

type Variant = 'danger' | 'warning' | 'downgrade';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}

const config: Record<Variant, {
  Icon: React.ElementType;
  iconRing: string;
  iconColor: string;
  bar: string;
  btn: string;
}> = {
  danger: {
    Icon: Trash2,
    iconRing: 'bg-red-50 ring-1 ring-red-100',
    iconColor: 'text-red-600',
    bar: 'bg-red-500',
    btn: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    Icon: AlertTriangle,
    iconRing: 'bg-amber-50 ring-1 ring-amber-100',
    iconColor: 'text-amber-600',
    bar: 'bg-primary',
    btn: 'bg-primary hover:bg-[#C4531A] text-white',
  },
  downgrade: {
    Icon: ArrowDownCircle,
    iconRing: 'bg-primary/10 ring-1 ring-primary/20',
    iconColor: 'text-primary',
    bar: 'bg-primary',
    btn: 'bg-dark hover:bg-[#2d2d2d] text-white',
  },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const { Icon, iconRing, iconColor, bar, btn } = config[variant];

  return (
    /* Overlay — bottom-sheet on mobile, centred on sm+ */
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onCancel}
    >
      <div
        className="w-full sm:max-w-md bg-white sm:rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Orange/red accent bar — same 3px style used across the dashboard */}
        <div className={`h-[3px] w-full ${bar}`} />

        <div className="p-6 sm:p-7">
          {/* Icon + copy */}
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${iconRing}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h2 className="text-[15px] font-semibold text-dark leading-snug">
                {title}
              </h2>
              <p className="mt-1.5 text-sm text-subtle leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Buttons — stacked on mobile, side-by-side on sm+ */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-dark bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`w-full sm:w-auto px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${btn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
