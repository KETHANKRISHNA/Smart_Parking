import React from 'react';

/** Friendly "nothing here" panel with an optional call to action. */
export const EmptyState = ({ icon: Icon, title, children, action }) => (
  <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 space-y-4">
    {Icon && (
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>
    )}
    <div>
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      {children && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{children}</p>}
    </div>
    {action}
  </div>
);
