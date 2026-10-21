import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { formatDateTime, formatTime } from '../utils/datetime';
import { usePageTitle } from '../hooks/usePageTitle';

const STATUSES = [
  ['ALL', 'All statuses'],
  ['CONFIRMED', 'Confirmed'],
  ['COMPLETED', 'Completed'],
  ['PENDING_PAYMENT', 'Pending payment'],
  ['CANCELLED', 'Cancelled'],
  ['EXPIRED', 'Expired / no-show'],
];

export const AdminBookingsPage = () => {
  usePageTitle('Bookings');
  const toast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/bookings');
      setBookings(res.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancelBooking = async (b) => {
    const ok = await toast.confirm({
      title: `Cancel ${b.bookingReference}?`,
      message: b.paymentStatus === 'COMPLETED' ? 'The bay is released and the customer is refunded in full.' : 'The bay is released.',
      confirmLabel: 'Cancel booking',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.post(`/bookings/${b.id}/cancel`, { reason: 'Cancelled by administrator' });
      toast.success('Booking cancelled.');
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.message || 'Cancellation failed');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const matches = !q || [b.bookingReference, b.vehicleNumber, b.userName, b.locationName].some((v) => v?.toLowerCase().includes(q));
      return matches && (statusFilter === 'ALL' || b.status === statusFilter);
    });
  }, [bookings, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">All reservations</h1>
        <p className="text-xs text-slate-500 mt-0.5">Inspect bookings, gate sessions and payments. Showing the most recent {bookings.length} bookings.</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <label htmlFor="booking-search" className="sr-only">Search bookings</label>
          <input id="booking-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference, plate, driver or facility…" className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white" />
        </div>
        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
        <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-52 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
          {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500" role="status">Loading bookings…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-4">Reference</th>
                  <th scope="col" className="py-3 px-4">Driver</th>
                  <th scope="col" className="py-3 px-4">Facility</th>
                  <th scope="col" className="py-3 px-4">Bay &amp; plate</th>
                  <th scope="col" className="py-3 px-4">Window</th>
                  <th scope="col" className="py-3 px-4">Fare</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4 text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{b.bookingReference}</td>
                    <td className="py-3.5 px-4"><div className="font-bold text-slate-900">{b.userName}</div><div className="text-[11px] text-slate-500">{b.userEmail}</div></td>
                    <td className="py-3.5 px-4"><div className="font-bold text-slate-900">{b.locationName}</div><div className="text-[11px] text-slate-500">{b.locationCity}</div></td>
                    <td className="py-3.5 px-4"><span className="font-mono font-bold text-slate-800">Bay {b.slotNumber}</span><div className="text-[11px] font-mono text-slate-500 uppercase">{b.vehicleNumber}</div></td>
                    <td className="py-3.5 px-4 text-slate-600"><div>{formatDateTime(b.startTime).split(',').slice(0, 2).join(',')}</div><div className="text-[11px] text-slate-500">{formatTime(b.startTime)} – {formatTime(b.endTime)}</div></td>
                    <td className="py-3.5 px-4 font-black text-slate-900">₹{b.totalAmount}</td>
                    <td className="py-3.5 px-4"><StatusBadge status={b.status} /></td>
                    <td className="py-3.5 px-4 text-right"><button type="button" onClick={() => setSelected(b)} className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg">Inspect</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No bookings match your filters.</p>}
          </div>
        )}
      </div>

      {selected && (
        <Modal title="Reservation details" size="max-w-md" onClose={() => setSelected(null)}>
          <dl className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
            {[
              ['Reference', <strong key="r" className="font-mono text-blue-600">{selected.bookingReference}</strong>],
              ['Driver', <strong key="d">{selected.userName} ({selected.userEmail})</strong>],
              ['Facility', <strong key="f">{selected.locationName}</strong>],
              ['Bay & plate', <strong key="b">Bay {selected.slotNumber} · {selected.vehicleNumber}</strong>],
              ['Payment', <strong key="p">{selected.paymentStatus ? `${selected.paymentStatus} (${selected.paymentMethod?.replace('_', ' ')})` : 'No payment yet'}</strong>],
              ['Entry scan', <strong key="e">{selected.entryTime ? formatDateTime(selected.entryTime) : 'Not entered'}</strong>],
              ['Exit scan', <strong key="x">{selected.exitTime ? formatDateTime(selected.exitTime) : 'Not exited'}</strong>],
              ['Total', <strong key="t" className="text-slate-900">₹{selected.totalAmount}</strong>],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4"><dt className="text-slate-500">{label}</dt><dd className="text-right">{value}</dd></div>
            ))}
          </dl>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            {(selected.status === 'CONFIRMED' || selected.status === 'PENDING_PAYMENT') && !selected.entryTime && (
              <button type="button" onClick={() => cancelBooking(selected)} className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl">Cancel &amp; refund</button>
            )}
            <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl">Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
};
