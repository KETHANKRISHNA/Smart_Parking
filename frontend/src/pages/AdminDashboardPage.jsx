import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { DashboardSkeleton } from '../components/common/Skeleton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Building2, Grid, CheckCircle2, CreditCard, Percent, Activity } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export const AdminDashboardPage = () => {
  usePageTitle('Admin overview');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        if (res.success && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load admin analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error || !stats) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm">
        Failed to load administrative analytics: {error}
      </div>
    );
  }

  // Format vehicle type distribution data for Recharts PieChart
  const vehicleChartData = [
    { name: 'Standard Car', value: stats.vehicleDistribution?.CAR || 0, color: '#3B82F6' },
    { name: 'EV Bay', value: stats.vehicleDistribution?.EV || 0, color: '#10B981' },
    { name: 'Two-Wheeler (Bike)', value: stats.vehicleDistribution?.BIKE || 0, color: '#8B5CF6' },
    { name: 'Accessible Priority', value: stats.vehicleDistribution?.ACCESSIBLE || 0, color: '#F59E0B' },
  ].filter(d => d.value > 0);

  const displayVehicleData = vehicleChartData;

  return (
    <div className="space-y-8">
      
      {/* Top Banner (Echoing Admin Dashboard from Reference Poster) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            Admin overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Operations dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Facilities, bay utilisation, revenue and reservations at a glance
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/admin/locations"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            Manage Facilities
          </Link>
          <Link
            to="/admin/slots"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Grid className="w-4 h-4" />
            Slots Inventory
          </Link>
        </div>
      </div>

      {/* 6 Metric KPI Cards (Inspired by the Reference Poster Admin Dashboard) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Locations</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalLocations}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Parking facilities</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase">Total Bays</span>
            <Grid className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalSlots}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Physical parking slots</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.availableSlots}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Free right now</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Confirmed bookings</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-700">{stats.activeReservations}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Paid, not yet used</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Total Revenue</span>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{stats.totalRevenue}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">From completed payments</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-bold uppercase">Occupancy</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.occupancyPercentage}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Utilization rate</div>
        </div>
      </div>

      {/* Visual Analytics Grid (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Revenue & Booking Trends Area Chart (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900">Booking &amp; revenue trends</h2>
              <p className="text-xs text-slate-400">Revenue and new bookings over the past 7 days</p>
            </div>

          </div>

          <div className="h-72 w-full pt-4 relative">
            {!(stats.revenueTrend || []).some((d) => Number(d.revenue) > 0 || Number(d.bookings) > 0) && (
              <p className="absolute inset-0 z-10 flex items-center justify-center text-xs text-slate-500">No bookings in the last 7 days yet.</p>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.revenueTrend || []} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(37,99,235,0.06)' }}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(value, name) => (name === 'revenue' ? [`₹${value}`, 'Revenue'] : [value, 'Bookings'])}
                />
                <Bar dataKey="revenue" fill="#2563EB" radius={[8, 8, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Classification Donut Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Vehicle Type Breakdown</h3>
            <p className="text-xs text-slate-400">Distribution across user reservations</p>
          </div>

          {displayVehicleData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">No bookings yet.</div>
          ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayVehicleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {displayVehicleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '10px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            {displayVehicleData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600">{item.name}: <strong>{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Locations & Recent Bookings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Locations Table (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">Top Facilities</h3>
            <Link to="/admin/locations" className="text-xs font-bold text-blue-600 hover:text-blue-700">View All</Link>
          </div>

          <div className="space-y-3 pt-1">
            {stats.topLocations?.length === 0 && <p className="text-xs text-slate-500">No bookings yet.</p>}
            {stats.topLocations?.map((loc, idx) => (
              <div key={loc.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{loc.name}</h4>
                  </div>
                </div>

                <div className="text-right">
                  <strong className="text-xs font-black text-slate-900">₹{loc.revenue}</strong>
                  <div className="text-[11px] text-slate-500">{loc.bookingsCount} bookings</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900">Live Reservations</h3>
              <p className="text-xs text-slate-400">Latest platform-wide bookings</p>
            </div>
            <Link to="/admin/bookings" className="text-xs font-bold text-blue-600 hover:text-blue-700">All Bookings</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Ref</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Location / Bay</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {stats.recentBookings?.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-blue-600">{b.bookingReference}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{b.userName}</div>
                      <div className="text-[11px] text-slate-400">{b.userPhone || b.userEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">{b.locationName}</div>
                      <div className="text-[11px] font-mono text-slate-500">Bay {b.slotNumber} • {b.vehicleNumber}</div>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900">₹{b.totalAmount}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
