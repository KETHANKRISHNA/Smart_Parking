import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Calendar,
  Clock,
  Car,
  QrCode,
  MapPin,
  TrendingUp,
  CreditCard,
  Search,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export const UserDashboardPage = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await api.get('/bookings/my');
        if (res.success && res.data) {
          setBookings(res.data);
        }
      } catch (err) {
        console.warn('Could not load user bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserStats();
  }, []);

  const activeBooking = bookings.find((b) => b.status === 'CONFIRMED' || b.status === 'PENDING_PAYMENT');
  const totalSpent = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Driver Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Driver'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
            Manage your active digital QR tickets, reserve parking slots ahead of time, and review your cashless parking history.
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <Link
            to="/search"
            className="px-6 py-3 rounded-2xl bg-white text-blue-900 font-bold text-xs shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2 hover:scale-105"
          >
            <Search className="w-4 h-4 text-blue-600" />
            Find & Reserve Parking
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Total Bookings</span>
            <strong className="text-2xl font-black text-slate-900">{bookings.length}</strong>
            <div className="text-[11px] text-slate-500 mt-0.5">Reservations made</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Active Pass</span>
            <strong className="text-2xl font-black text-emerald-600">
              {activeBooking ? '1 Active' : 'None'}
            </strong>
            <div className="text-[11px] text-slate-500 mt-0.5">Ready for gate scan</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase block">Total Spent</span>
            <strong className="text-2xl font-black text-slate-900">₹{totalSpent.toFixed(2)}</strong>
            <div className="text-[11px] text-slate-500 mt-0.5">Cashless transactions</div>
          </div>
        </div>
      </div>

      {/* Active Pass Highlight (if any) */}
      {activeBooking && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-3xl border border-emerald-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30">
              <QrCode className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">ACTIVE NOW</span>
                <span className="text-xs font-mono font-bold text-emerald-950">{activeBooking.bookingReference}</span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 mt-1">{activeBooking.locationName}</h3>
              <p className="text-xs text-slate-600 flex items-center gap-2 mt-1">
                <span>Bay: <strong className="text-slate-900 font-mono">{activeBooking.slotNumber}</strong></span>
                <span>•</span>
                <span>Plate: <strong className="text-slate-900 uppercase font-mono">{activeBooking.vehicleNumber}</strong></span>
                <span>•</span>
                <span>Window: {new Date(activeBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(activeBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </p>
            </div>
          </div>

          <Link
            to={`/booking/ticket/${activeBooking.id}`}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105 shrink-0"
          >
            Show Gate QR Pass
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Recent Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Parking Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5">History of your latest reserved slots and payments</p>
          </div>
          <Link to="/bookings" className="text-xs font-bold text-blue-600 hover:text-blue-700">
            View All ({bookings.length})
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-semibold">No recent parking activity</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Bay & Vehicle</th>
                  <th className="py-3 px-3">Timing</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-blue-600">
                      {b.bookingReference}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900">{b.locationName}</div>
                      <div className="text-[10px] text-slate-400">{b.locationCity}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-slate-900">Bay {b.slotNumber}</span>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{b.vehicleNumber}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">
                      <div>{new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400">{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3.5 px-3 font-black text-slate-900">
                      ₹{b.totalAmount}
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Link
                        to={`/booking/ticket/${b.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <QrCode className="w-3 h-3" /> Ticket
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
