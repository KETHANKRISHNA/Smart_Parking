import React from 'react';

/** A grey pulsing placeholder; callers size it with className. Hidden from screen readers (the parent announces loading). */
export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} aria-hidden="true" />
);

/** Placeholder layout for a dashboard-style page: header, KPI row and a content block. */
export const DashboardSkeleton = () => (
  <div className="space-y-6" role="status" aria-label="Loading">
    <Skeleton className="h-36 rounded-3xl" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
    <Skeleton className="h-72 rounded-3xl" />
  </div>
);
