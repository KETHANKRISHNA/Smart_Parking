import React from 'react';
import { Check } from 'lucide-react';

const STEPS = ['Choose a bay', 'Review', 'Pay', 'Your ticket'];

/** Where the driver is in the booking flow. `current` is 1 to 4; earlier steps show as done. */
export const BookingStepper = ({ current }) => (
  <nav aria-label="Booking progress" className="no-print">
    <ol className="flex items-center justify-center gap-1 sm:gap-2 text-[11px] sm:text-xs font-semibold">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-1 sm:gap-2" aria-current={active ? 'step' : undefined}>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {done ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : n}
            </span>
            <span className={`${active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'} ${active ? '' : 'hidden sm:inline'}`}>{label}</span>
            {n < STEPS.length && <span className={`w-4 sm:w-8 h-0.5 rounded ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  </nav>
);
