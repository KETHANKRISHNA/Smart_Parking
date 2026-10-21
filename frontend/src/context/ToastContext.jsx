import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200 bg-emerald-50 text-emerald-900', tint: 'text-emerald-600' },
  error: { icon: XCircle, ring: 'border-rose-200 bg-rose-50 text-rose-900', tint: 'text-rose-600' },
  info: { icon: Info, ring: 'border-blue-200 bg-blue-50 text-blue-900', tint: 'text-blue-600' },
};

let nextId = 1;

/** Non-blocking toasts plus a promise-based confirm dialog, replacing window.alert / window.confirm. */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const confirmButtonRef = useRef(null);

  const dismiss = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), type === 'error' ? 7000 : 4000);
    },
    [dismiss]
  );

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setDialog({ confirmLabel: 'Confirm', cancelLabel: 'Cancel', danger: false, ...options, resolve });
      }),
    []
  );

  const settle = useCallback(
    (result) => {
      dialog?.resolve(result);
      setDialog(null);
    },
    [dialog]
  );

  useEffect(() => {
    if (!dialog) return undefined;
    confirmButtonRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && settle(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog, settle]);

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      confirm,
    }),
    [push, confirm]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:w-96 pointer-events-none" aria-live="polite">
        {toasts.map((t) => {
          const { icon: Icon, ring, tint } = STYLES[t.type];
          return (
            <div
              key={t.id}
              role={t.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg ${ring}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${tint}`} aria-hidden="true" />
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="opacity-60 hover:opacity-100">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>

      {dialog && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50" onClick={() => settle(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-full p-2 ${dialog.danger ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h2 id="confirm-title" className="text-base font-bold text-slate-900">{dialog.title}</h2>
                {dialog.message && <p id="confirm-message" className="mt-1 text-sm text-slate-600">{dialog.message}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => settle(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {dialog.cancelLabel}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={() => settle(true)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${dialog.danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
