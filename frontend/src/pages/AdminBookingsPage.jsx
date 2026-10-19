import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  CalendarCheck,
  Search,
  Filter,
  QrCode,
  X,
  MapPin,
  Clock,
  Car,
  AlertTriangle
} from 'lucide-react';

export const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings');
      if (res.success && res.data) {
        setBookings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking and issue a full refund?')) return;
    try {
      await api.post(`/bookings/${id}/cancel`, { reason: 'Cancelled by Administrator' });
      fetchBookings();
      setSelectedBooking(null);
    } catch (err) {
      alert('Cancellation failed: ' + err.message);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      b.bookingReference?.toLowerCase().includes(search.toLowerCase()) ||
      b.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.userName?.toLowerCase().includes(search.toLowerCase()) ||
      b.locationName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">System Reservations Registry</h1>
          <p className="text-xs text-slate-500 mt-0.5">Audit and inspect all driver bookings, gate sessions, and revenues</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref (e.g. SP-2026), plate number, or driver name..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
        </select>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading registry...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Bay & Plate</th>
                  <th className="py-3 px-4">Window</th>
                  <th className="py-3 px-4">Fare</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {b.bookingReference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.userName}</div>
                      <div className="text-[10px] text-slate-400">{b.userEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{b.locationName}</div>
                      <div className="text-[10px] text-slate-400">{b.locationCity}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-800">Bay {b.slotNumber}</span>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">{b.vehicleNumber}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{new Date(b.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <div className="text-[10px] text-slate-400">{new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ₹{b.totalAmount}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Reservation Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Ref:</span>
                <strong className="font-mono text-blue-600">{selectedBooking.bookingReference}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Driver:</span>
                <strong>{selectedBooking.userName} ({selectedBooking.userEmail})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Location:</span>
                <strong>{selectedBooking.locationName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bay & Plate:</span>
                <strong>Bay {selectedBooking.slotNumber} • {selectedBooking.vehicleNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Entry Scan:</span>
                <strong>{selectedBooking.entryTime ? new Date(selectedBooking.entryTime).toLocaleString() : 'Not Entered'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Exit Scan:</span>
                <strong>{selectedBooking.exitTime ? new Date(selectedBooking.exitTime).toLocaleString() : 'Not Exited'}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <strong className="text-slate-900">₹{selectedBooking.totalAmount}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedBooking.status === 'CONFIRMED' && (
                <button
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                >
                  Cancel & Refund
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
