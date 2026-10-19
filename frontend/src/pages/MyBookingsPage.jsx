import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Calendar,
  MapPin,
  Clock,
  Car,
  QrCode,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        const res = await api.get('/bookings/my');
        if (res.success && res.data) {
          setBookings(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };
    fetchMyBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ACTIVE') return b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT';
    if (activeTab === 'COMPLETED') return b.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Parking Reservations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your active digital ticket passes, past parking history, and receipts
          </p>
        </div>

        <Link
          to="/search"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto transition-all hover:scale-105"
        >
          <Search className="w-3.5 h-3.5" />
          Book New Slot
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Reservations' },
          { key: 'ACTIVE', label: 'Active & Upcoming' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 border-b-2 font-bold transition-all shrink-0 ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-14 text-center border border-slate-200 space-y-4">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">No Reservations Found</h3>
            <p className="text-xs text-slate-400 mt-1">
              You haven't made any parking reservations in this category yet.
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            Search & Reserve Bay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Left Details */}
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {b.bookingReference}
                  </span>
                  <StatusBadge status={b.status} />
                  <span className="text-[11px] text-slate-400">• Booked on {new Date(b.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{b.locationName}</h3>

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{b.locationAddress}, {b.locationCity}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-1 text-slate-600">
                  <span className="flex items-center gap-1">
                    <strong className="text-slate-900 font-mono">Bay {b.slotNumber}</strong> ({b.floorLevel})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{b.vehicleNumber}</strong> ({b.vehicleType})
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>
              </div>

              {/* Right Price & Actions */}
              <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-2 shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Fare</span>
                  <strong className="text-xl font-black text-slate-900">₹{b.totalAmount}</strong>
                </div>

                <Link
                  to={`/booking/ticket/${b.id}`}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Digital Pass & QR
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
