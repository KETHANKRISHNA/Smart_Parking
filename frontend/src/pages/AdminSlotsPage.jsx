import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Grid,
  Plus,
  Trash2,
  Zap,
  Car,
  Bike,
  Building,
  CheckCircle2,
  AlertTriangle,
  X,
  Filter
} from 'lucide-react';

export const AdminSlotsPage = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newSlot, setNewSlot] = useState({
    slotNumber: '',
    slotType: 'CAR',
    status: 'AVAILABLE',
    floorLevel: 'Ground Floor',
    hasEvCharger: false,
    customHourlyRate: '',
  });

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get('/admin/locations');
        if (res.success && res.data.length > 0) {
          setLocations(res.data);
          setSelectedLocId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const fetchSlots = async (locId) => {
    if (!locId) return;
    try {
      const res = await api.get(`/parking/${locId}/slots`);
      if (res.success) {
        setSlots(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedLocId) {
      fetchSlots(selectedLocId);
    }
  }, [selectedLocId]);

  const handleToggleSlotStatus = async (slotId, currentStatus) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'OUT_OF_SERVICE' : 'AVAILABLE';
    try {
      await api.patch(`/admin/slots/${slotId}/status`, { status: nextStatus });
      fetchSlots(selectedLocId);
    } catch (err) {
      alert('Failed to update slot status: ' + err.message);
    }
  };

  const handleDeleteSlot = async (slotId, slotNumber) => {
    if (!window.confirm(`Delete bay ${slotNumber}?`)) return;
    try {
      await api.delete(`/admin/slots/${slotId}`);
      fetchSlots(selectedLocId);
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/slots', {
        ...newSlot,
        locationId: Number(selectedLocId),
        customHourlyRate: newSlot.customHourlyRate ? Number(newSlot.customHourlyRate) : null,
      });
      setShowAddModal(false);
      setNewSlot({
        slotNumber: '',
        slotType: 'CAR',
        status: 'AVAILABLE',
        floorLevel: 'Ground Floor',
        hasEvCharger: false,
        customHourlyRate: '',
      });
      fetchSlots(selectedLocId);
    } catch (err) {
      alert('Failed to create slot: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Location Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Parking Slot Inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure individual parking bays, EV chargers, and maintenance states</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedLocId}
            onChange={(e) => setSelectedLocId(e.target.value)}
            className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-2xs focus:outline-hidden"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.city})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 shrink-0 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            Add Bay
          </button>
        </div>
      </div>

      {/* Visual Slot Layout Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-base text-slate-900">Configured Bays ({slots.length})</h2>
          </div>
          <span className="text-xs text-slate-400">Click toggle button to switch between Available and Maintenance</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {slots.map((slot) => {
            const isAvailable = slot.status === 'AVAILABLE';
            const isOutOfService = slot.status === 'OUT_OF_SERVICE';

            return (
              <div
                key={slot.id}
                className={`p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between h-36 ${
                  isAvailable
                    ? 'bg-emerald-50/50 border-emerald-300'
                    : isOutOfService
                    ? 'bg-slate-100 border-slate-300 opacity-60'
                    : 'bg-rose-50/50 border-rose-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{slot.floorLevel}</span>
                  {slot.hasEvCharger && (
                    <span className="p-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5">
                      <Zap className="w-3 h-3 fill-emerald-600" />
                    </span>
                  )}
                </div>

                <div className="text-center my-1">
                  <div className="text-xl font-black font-mono text-slate-900">{slot.slotNumber}</div>
                  <span className="text-[10px] font-semibold text-slate-500 capitalize">{slot.slotType.toLowerCase()}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleSlotStatus(slot.id, slot.status)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                      isAvailable
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {isAvailable ? 'Active' : 'Offline'}
                  </button>

                  <button
                    onClick={() => handleDeleteSlot(slot.id, slot.slotNumber)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Delete Bay"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Parking Bay</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bay Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. C01, E04, B10"
                  value={newSlot.slotNumber}
                  onChange={(e) => setNewSlot({ ...newSlot, slotNumber: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bay Type</label>
                <select
                  value={newSlot.slotType}
                  onChange={(e) => setNewSlot({ ...newSlot, slotType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="CAR">Car</option>
                  <option value="EV">EV (Electric Vehicle)</option>
                  <option value="BIKE">Two-Wheeler (Bike)</option>
                  <option value="ACCESSIBLE">Accessible Priority</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Floor Level</label>
                <input
                  type="text"
                  value={newSlot.floorLevel}
                  onChange={(e) => setNewSlot({ ...newSlot, floorLevel: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="evCheck"
                  checked={newSlot.hasEvCharger}
                  onChange={(e) => setNewSlot({ ...newSlot, hasEvCharger: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <label htmlFor="evCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Equipped with Fast EV Charger
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/30"
                >
                  Save Bay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
