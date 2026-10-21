import React, { useId } from 'react';

export const inputClass =
  'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all disabled:opacity-60';

/**
 * Label + input pair with the label properly associated (htmlFor/id), an optional leading icon,
 * helper text and an inline error that screen readers announce.
 */
export const FormField = ({ label, icon: Icon, hint, error, className = '', as = 'input', children, ...inputProps }) => {
  const id = useId();
  const Control = as;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />}
        <Control
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
          className={`${inputClass} ${Icon ? 'pl-10' : ''} ${error ? 'border-rose-400' : ''}`}
        >
          {children}
        </Control>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] font-medium text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
};
