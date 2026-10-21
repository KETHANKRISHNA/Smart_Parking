import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, MapPin, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useManagerFacility } from '../hooks/useManagerFacility';
import { StatusBadge } from '../components/common/StatusBadge';
import { BayTile } from '../components/common/BayTile';
import { FacilityPicker } from '../components/common/FacilityPicker';
import { formatTime } from '../utils/datetime';

export const ManagerDashboardPage = () => {
  const toast = useToast();
  const { facilities, facility, locationId, setLocationId, loading: facilitiesLoading, error: facilitiesError } = useManagerFacility();
  const [slots, setSlots] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!locationId) return;
    setError('');
    try {
      const params = { locationId };
      const [slotsRes, todayRes] = await Promise.all([
        api.get('/manager/facility/slots', { params }),
        api.get('/manager/today-bookings', { params }),
      ]);
      setSlots(slotsRes.data);
      setTodayBookings(todayRes.data);
    } catch (err) {
      setError(err.message || 'Could not load facility data');
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (slot) => {
    const next = slot.status === 'AVAILABLE' ? 'OUT_OF_SERVICE' : 'AVAILABLE';
    if (next === 'OUT_OF_SERVICE') {
      const ok = await toast.confirm({
        title: `Take bay ${slot.slotNumber} out of service?`,
        message: 'Drivers will not be able to book it until you return it to service.',
        confirmLabel: 'Take out of service',
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await api.patch(`/manager/slots/${slot.id}/status`, { status: next });
      toast.success(`Bay ${slot.slotNumber} is now ${next === 'AVAILABLE' ? 'available' : 'out of service'}.`);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not update the bay');
    }
  };

  if (facilitiesLoading || (loading && locationId)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading facility">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (facilitiesError || !facility) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-2">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" aria-hidden="true" />
        <h1 className="text-lg font-bold text-slate-900">No facility assigned</h1>
        <p className="text-sm text-slate-600">{facilitiesError || 'An administrator needs to assign you to a parking facility before you can manage it.'}</p>
      </div>
    );
  }

  const occupied = slots.filter((s) => s.status === 'OCCUPIED').length;
  const available = slots.filter((s) => s.status === 'AVAILABLE').length;
  const outOfService = slots.filter((s) => s.status === 'OUT_OF_SERVICE').length;
  const usable = slots.length - outOfService;
  const occupancy = usable > 0 ? Math.round((occupied / usable) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">Facility manager</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">{facility.name}</h1>
          <p className="text-xs text-purple-200 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-300" aria-hidden="true" />
            <span>{facility.address}, {facility.city}</span>
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-start md:items-end gap-3">
          <div className="[&_label]:text-purple-200"><FacilityPicker facilities={facilities} value={locationId} onChange={setLocationId} /></div>
          <Link to="/manager/scanner" className="px-6 py-3 rounded-2xl bg-white text-purple-900 font-extrabold text-xs shadow-lg hover:bg-purple-50 transition-all flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-purple-600" aria-hidden="true" /> Open gate scanner
          </Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Total capacity</span>
          <strong className="text-2xl font-black text-slate-900">{slots.length} bays</strong>
          <div className="text-[10px] text-slate-500 mt-1">{outOfService} out of service</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-emerald-700 block">Available now</span>
          <strong className="text-2xl font-black text-emerald-600">{available} bays</strong>
          <div className="text-[10px] text-slate-500 mt-1">Free and ready</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-rose-700 block">Vehicles inside</span>
          <strong className="text-2xl font-black text-rose-600">{occupied}</strong>
          <div className="text-[10px] text-slate-500 mt-1">Checked in at the gate</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-purple-700 block">Live occupancy</span>
          <strong className="text-2xl font-black text-purple-700">{occupancy}%</strong>
          <div className="text-[10px] text-slate-500 mt-1">Of bays in service</div>
        </div>
      </div>

      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-4" aria-labelledby="bays-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="bays-heading" className="text-base font-bold text-slate-900">Live parking bays</h2>
            <p className="text-xs text-slate-500">Select a free bay to take it out of service, or an offline bay to bring it back</p>
          </div>
          <Link to="/manager/slots" className="text-xs font-bold text-purple-600 hover:text-purple-700">Bay inventory</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {slots.map((s) => <BayTile key={s.id} slot={s} onToggle={handleToggle} />)}
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-4" aria-labelledby="today-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="today-heading" className="text-base font-bold text-slate-900">Today&apos;s reservations ({todayBookings.length})</h2>
            <p className="text-xs text-slate-500">Bookings whose time window falls today</p>
          </div>
          <Link to="/manager/scanner" className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1">
            <ScanLine className="w-3.5 h-3.5" aria-hidden="true" /> Scan QR pass
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs">No reservations for today.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th scope="col" className="py-2.5 px-3">Ref</th>
                  <th scope="col" className="py-2.5 px-3">Driver</th>
                  <th scope="col" className="py-2.5 px-3">Bay &amp; plate</th>
                  <th scope="col" className="py-2.5 px-3">Window</th>
                  <th scope="col" className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {todayBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 px-3 font-mono font-bold text-purple-700">{b.bookingReference}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{b.userName}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900">Bay {b.slotNumber}</span>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">{b.vehicleNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{formatTime(b.startTime)} – {formatTime(b.endTime)}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={b.sessionStatus === 'ACTIVE' ? 'ACTIVE' : b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
