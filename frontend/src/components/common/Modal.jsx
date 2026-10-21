import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

/** Accessible modal dialog: role="dialog", labelled by its title, closes on Esc / backdrop click, restores focus. */
export const Modal = ({ title, onClose, children, size = 'max-w-sm' }) => {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    panelRef.current?.querySelector('input, select, textarea, button:not([data-close])')?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`bg-white rounded-3xl p-6 sm:p-7 ${size} w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-slate-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h2 id={titleId} className="font-bold text-base text-slate-900">{title}</h2>
          <button type="button" data-close onClick={onClose} aria-label="Close dialog" className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
