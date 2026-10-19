import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Building2,
  ScanLine,
  Grid,
  CheckCircle2,
  Clock,
  Car,
  Zap,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const ManagerDashboardPage = () => {
  const [facility, setFacility] = useState(null);
  const [slots, setSlots] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagerData = async () => {
      try {
        const facRes = await api.get('/manager/facility');
        if (facRes.success && facRes.data) {
          setFacility(facRes.data);
        }

        const slotsRes = await api.get('/manager/facility/slots');
        if (slotsRes.success && slotsRes.data) {
          setSlots(slotsRes.data);
        }

        const todayRes = await api.get('/manager/today-bookings');
        if (todayRes.success && todayRes.data) {
          setTodayBookings(todayRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchManagerData();
  }, []);

  const handleToggleSlot = async (slotId, currentStatus) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'OUT_OF_SERVICE' : 'AVAILABLE';
    try {
      await api.patch(`/manager/slots/${slotId}/status`, { status: nextStatus });
      const slotsRes = await api.get('/manager/facility/slots');
      if (slotsRes.success) setSlots(slotsRes.data);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const occupiedCount = slots.filter((s) => s.status === 'OCCUPIED').length;
  const availableCount = slots.filter((s) => s.status === 'AVAILABLE').length;
  const maintenanceCount = slots.filter((s) => s.status === 'OUT_OF_SERVICE').length;
  const occupancyRate = slots.length > 0 ? Math.round((occupiedCount / slots.length) * 100) : 0;

  return (
    <div className="space-y-8">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
            FACILITY MANAGER GATEWAY
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
            {facility?.name || 'Assigned Parking Facility'}
          </h1>
          <p className="text-xs text-purple-200 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-purple-300" />
            <span>{facility?.address}, {facility?.city}</span>
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <Link
            to="/manager/scanner"
            className="px-6 py-3 rounded-2xl bg-white text-purple-900 font-extrabold text-xs shadow-lg hover:bg-purple-50 transition-all flex items-center gap-2 hover:scale-105"
          >
            <ScanLine className="w-4 h-4 text-purple-600" />
            Open Gate QR Scanner
          </Link>
        </div>
      </div>

      {/* Facility KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Capacity</span>
          <strong className="text-2xl font-black text-slate-900">{slots.length} Bays</strong>
          <div className="text-[10px] text-slate-500 mt-1">Configured in facility</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-emerald-600 block">Available Now</span>
          <strong className="text-2xl font-black text-emerald-600">{availableCount} Bays</strong>
          <div className="text-[10px] text-slate-500 mt-1">Green state</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-rose-600 block">Parked / Occupied</span>
          <strong className="text-2xl font-black text-rose-600">{occupiedCount} Vehicles</strong>
          <div className="text-[10px] text-slate-500 mt-1">Inside gate</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-purple-600 block">Live Occupancy</span>
          <strong className="text-2xl font-black text-purple-700">{occupancyRate}%</strong>
          <div className="text-[10px] text-slate-500 mt-1">Facility saturation</div>
        </div>
      </div>

      {/* Live Facility Bays Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Live Parking Bays</h2>
            <p className="text-xs text-slate-400">Click any bay to mark for maintenance or toggle availability</p>
          </div>
          <Link to="/manager/slots" className="text-xs font-bold text-purple-600 hover:text-purple-700">
            Slot Inventory
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {slots.map((s) => {
            const isAvail = s.status === 'AVAILABLE';
            const isOcc = s.status === 'OCCUPIED';
            const isMaint = s.status === 'OUT_OF_SERVICE';

            return (
              <div
                key={s.id}
                onClick={() => handleToggleSlot(s.id, s.status)}
                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-center h-28 ${
                  isAvail
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-500'
                    : isOcc
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-slate-100 border-slate-300 text-slate-400'
                }`}
                title="Click to toggle status"
              >
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>{s.floorLevel}</span>
                  {s.hasEvCharger && <Zap className="w-3 h-3 fill-emerald-500 text-emerald-600" />}
                </div>

                <div className="text-lg font-black font-mono">{s.slotNumber}</div>

                <div className="text-[10px] font-bold capitalize">
                  {isAvail ? 'Available' : isOcc ? 'Occupied' : 'Offline'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Arrivals Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Today's Expected Reservations ({todayBookings.length})</h2>
            <p className="text-xs text-slate-400">Driver arrival and departure timeline for today</p>
          </div>
          <Link
            to="/manager/scanner"
            className="px-3.5 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1"
          >
            <ScanLine className="w-3.5 h-3.5" /> Scan QR Pass
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            No incoming arrivals recorded for today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Ref</th>
                  <th className="py-2.5 px-3">Driver Name</th>
                  <th className="py-2.5 px-3">Plate & Bay</th>
                  <th className="py-2.5 px-3">Arrival Window</th>
                  <th className="py-2.5 px-3">Gate Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {todayBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="py-3 px-3 font-mono font-bold text-purple-700">{b.bookingReference}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{b.userName}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900">Bay {b.slotNumber}</span>
                      <div className="text-[10px] font-mono text-slate-400 uppercase">{b.vehicleNumber}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={b.status} />
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
