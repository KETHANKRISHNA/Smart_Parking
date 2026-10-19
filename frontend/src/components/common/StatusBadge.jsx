import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Zap, Car, Bike, ShieldCheck, Activity } from 'lucide-react';

export const StatusBadge = ({ status, type = 'status' }) => {
  const s = String(status || '').toUpperCase();

  // Booking or General Status
  if (s === 'CONFIRMED' || s === 'COMPLETED' || s === 'AVAILABLE' || s === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        {s === 'CONFIRMED' ? 'Confirmed' : s === 'COMPLETED' ? 'Completed' : s === 'AVAILABLE' ? 'Available' : 'Active'}
      </span>
    );
  }

  if (s === 'RESERVED' || s === 'PENDING' || s === 'PENDING_PAYMENT') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        {s === 'PENDING_PAYMENT' ? 'Pending Payment' : s === 'RESERVED' ? 'Reserved' : 'Pending'}
      </span>
    );
  }

  if (s === 'OCCUPIED' || s === 'CANCELLED' || s === 'FAILED' || s === 'OVERSTAY') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-500" />
        {s === 'OCCUPIED' ? 'Occupied' : s === 'CANCELLED' ? 'Cancelled' : s === 'OVERSTAY' ? 'Overstay' : 'Failed'}
      </span>
    );
  }

  if (s === 'OUT_OF_SERVICE' || s === 'EXPIRED') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
        {s === 'OUT_OF_SERVICE' ? 'Out of Service' : 'Expired'}
      </span>
    );
  }

  // Slot Types
  if (s === 'CAR') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        <Car className="w-3 h-3" /> Car
      </span>
    );
  }
  if (s === 'EV') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
        <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" /> EV Bay
      </span>
    );
  }
  if (s === 'BIKE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        <Bike className="w-3 h-3" /> Bike
      </span>
    );
  }
  if (s === 'ACCESSIBLE') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
        ♿ Accessible
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
      {status}
    </span>
  );
};
