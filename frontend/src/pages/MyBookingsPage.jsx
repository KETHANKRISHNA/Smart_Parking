import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Car, QrCode, Search, CreditCard, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDateTime, formatTime } from '../utils/datetime';
import { usePageTitle } from '../hooks/usePageTitle';

const TABS = [
  { key: 'ALL', label: 'All reservations' },
  { key: 'ACTIVE', label: 'Active & upcoming' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled & expired' },
];

// A PENDING_PAYMENT booking whose hold has lapsed is effectively expired even before the server job runs
const effectiveStatus = (b) =>
  b.status === 'PENDING_PAYMENT' && b.holdExpiresAt && new Date(b.holdExpiresAt) < new Date() ? 'EXPIRED' : b.status;

export const MyBookingsPage = () => {
  usePageTitle('My bookings');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    api
      .get('/bookings/my')
      .then((res) => res.success && setBookings(res.data))
      .catch((err) => setError(err.message || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bookings.filter((b) => {
    const status = effectiveStatus(b);
    if (activeTab === 'ACTIVE') return status === 'CONFIRMED' || status === 'PENDING_PAYMENT';
    if (activeTab === 'COMPLETED') return status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return status === 'CANCELLED' || status === 'EXPIRED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My parking reservations</h1>
          <p className="text-xs text-slate-500 mt-1">Your tickets, upcoming reservations and past parking history</p>
        </div>
        <Link to="/search" className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all">
          <Search className="w-3.5 h-3.5" aria-hidden="true" /> Book a new bay
        </Link>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-1" role="tablist" aria-label="Filter reservations">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 border-b-2 font-bold transition-all shrink-0 ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4" role="status" aria-label="Loading bookings">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl bg-white border border-slate-200 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-14 text-center border border-slate-200 space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold text-slate-800">No reservations here</h2>
            <p className="text-xs text-slate-500 mt-1">You have no parking reservations in this category yet.</p>
          </div>
          <Link to="/search" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs">Search &amp; reserve a bay</Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((b) => {
            const status = effectiveStatus(b);
            return (
              <li key={b.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{b.bookingReference}</span>
                    <StatusBadge status={status} />
                    <span className="text-[11px] text-slate-500">• Booked {formatDateTime(b.createdAt).split(',').slice(0, 2).join(',')}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{b.locationName}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span>{b.locationAddress}, {b.locationCity}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs pt-1 text-slate-600">
                    <span><strong className="text-slate-900 font-mono">Bay {b.slotNumber}</strong> ({b.floorLevel})</span>
                    <span className="flex items-center gap-1"><Car className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" /><strong>{b.vehicleNumber}</strong></span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />{formatDateTime(b.startTime).split(',')[0]}, {formatTime(b.startTime)} – {formatTime(b.endTime)}</span>
                  </div>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-2 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-500 block uppercase font-semibold">Total fare</span>
                    <strong className="text-xl font-black text-slate-900">₹{b.totalAmount}</strong>
                  </div>
                  {status === 'PENDING_PAYMENT' ? (
                    <Link to={`/payment?bookingId=${b.id}`} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" aria-hidden="true" /> Pay now
                    </Link>
                  ) : (
                    <Link to={`/booking/ticket/${b.id}`} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" aria-hidden="true" /> {status === 'CONFIRMED' ? 'Pass & QR' : 'Details'}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
