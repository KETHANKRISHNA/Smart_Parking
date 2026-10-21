import React, { useCallback, useEffect, useState } from 'react';
import { Grid, Plus, Trash2, Zap, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { usePageTitle } from '../hooks/usePageTitle';

const EMPTY_SLOT = { slotNumber: '', slotType: 'CAR', floorLevel: 'Ground Floor', hasEvCharger: false, customHourlyRate: '' };

const LOOK = {
  AVAILABLE: 'bg-emerald-50/50 border-emerald-300',
  OUT_OF_SERVICE: 'bg-slate-100 border-slate-300 opacity-70',
  OCCUPIED: 'bg-rose-50/50 border-rose-300',
  RESERVED: 'bg-amber-50/50 border-amber-300',
};

export const AdminSlotsPage = () => {
  usePageTitle('Bay inventory');
  const toast = useToast();
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newSlot, setNewSlot] = useState(EMPTY_SLOT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/admin/locations')
      .then((res) => {
        setLocations(res.data);
        if (res.data.length > 0) setLocationId(String(res.data[0].id));
      })
      .catch((err) => setError(err.message || 'Could not load facilities'))
      .finally(() => setLoading(false));
  }, []);

  const loadSlots = useCallback(async () => {
    if (!locationId) return;
    try {
      const res = await api.get(`/parking/${locationId}/slots`);
      setSlots(res.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load bays');
    }
  }, [locationId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const toggleStatus = async (slot) => {
    const next = slot.status === 'AVAILABLE' ? 'OUT_OF_SERVICE' : 'AVAILABLE';
    try {
      await api.patch(`/admin/slots/${slot.id}/status`, { status: next });
      loadSlots();
    } catch (err) {
      toast.error(err.message || 'Could not update the bay');
    }
  };

  const deleteSlot = async (slot) => {
    const ok = await toast.confirm({
      title: `Delete bay ${slot.slotNumber}?`,
      message: 'Bays with booking history cannot be deleted; take them out of service instead.',
      confirmLabel: 'Delete bay',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/slots/${slot.id}`);
      toast.success(`Bay ${slot.slotNumber} deleted.`);
      loadSlots();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const createSlot = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/admin/slots', {
        ...newSlot,
        locationId: Number(locationId),
        status: 'AVAILABLE',
        customHourlyRate: newSlot.customHourlyRate ? Number(newSlot.customHourlyRate) : null,
      });
      setShowAdd(false);
      setNewSlot(EMPTY_SLOT);
      toast.success('Bay added.');
      loadSlots();
    } catch (err) {
      toast.error(err.fieldErrors ? Object.values(err.fieldErrors).join(' ') : err.message || 'Failed to create bay');
    } finally {
      setSaving(false);
    }
  };

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSlot((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center" role="status" aria-label="Loading"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Parking slot inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">Add bays, set EV chargers and rates, and manage maintenance states</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="facility" className="sr-only">Facility</label>
          <select id="facility" value={locationId} onChange={(e) => setLocationId(e.target.value)} className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 shadow-sm">
            {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name} ({loc.city})</option>)}
          </select>
          <button type="button" onClick={() => setShowAdd(true)} disabled={!locationId} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 shrink-0 disabled:opacity-50">
            <Plus className="w-4 h-4" aria-hidden="true" /> Add bay
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6" aria-labelledby="bays-title">
        <div className="flex items-center gap-2">
          <Grid className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <h2 id="bays-title" className="font-bold text-base text-slate-900">Configured bays ({slots.length})</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {slots.map((slot) => {
            const switchable = slot.status === 'AVAILABLE' || slot.status === 'OUT_OF_SERVICE';
            return (
              <div key={slot.id} className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between h-36 ${LOOK[slot.status] || LOOK.AVAILABLE}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">{slot.floorLevel}</span>
                  {slot.hasEvCharger && <span className="p-0.5 rounded bg-emerald-100 text-emerald-800" title="EV charger"><Zap className="w-3 h-3 fill-emerald-600" aria-label="EV charger" /></span>}
                </div>
                <div className="text-center my-1">
                  <div className="text-xl font-black font-mono text-slate-900">{slot.slotNumber}</div>
                  <span className="text-[11px] font-semibold text-slate-500 capitalize">{slot.slotType.toLowerCase()} · ₹{slot.effectiveHourlyRate}/h</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleStatus(slot)}
                    disabled={!switchable}
                    title={switchable ? 'Toggle in service / out of service' : 'Controlled by bookings and gate scans'}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors disabled:cursor-not-allowed ${slot.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                  >
                    {slot.status === 'AVAILABLE' ? 'In service' : slot.status === 'OUT_OF_SERVICE' ? 'Offline' : slot.status === 'OCCUPIED' ? 'Occupied' : 'Reserved'}
                  </button>
                  <button type="button" onClick={() => deleteSlot(slot)} className="text-slate-400 hover:text-rose-600 p-1" aria-label={`Delete bay ${slot.slotNumber}`}>
                    <Trash2 className="w-3 h-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {slots.length === 0 && !error && <p className="text-center text-sm text-slate-500 py-6">This facility has no bays yet.</p>}
      </section>

      {showAdd && (
        <Modal title="Add parking bay" onClose={() => setShowAdd(false)}>
          <form onSubmit={createSlot} className="space-y-3">
            <FormField label="Bay number" name="slotNumber" required maxLength={20} placeholder="e.g. C01, E04" value={newSlot.slotNumber} onChange={(e) => setField({ target: { name: 'slotNumber', value: e.target.value.toUpperCase() } })} />
            <FormField label="Bay type" as="select" name="slotType" value={newSlot.slotType} onChange={setField}>
              <option value="CAR">Car</option>
              <option value="EV">EV (electric vehicle)</option>
              <option value="BIKE">Two-wheeler</option>
              <option value="ACCESSIBLE">Accessible priority</option>
            </FormField>
            <FormField label="Floor level" name="floorLevel" maxLength={20} value={newSlot.floorLevel} onChange={setField} />
            <FormField label="Custom hourly rate (₹, optional)" type="number" name="customHourlyRate" min="0" step="0.5" hint="Leave blank to use the facility rate." value={newSlot.customHourlyRate} onChange={setField} />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
              <input type="checkbox" name="hasEvCharger" checked={newSlot.hasEvCharger} onChange={setField} className="w-4 h-4 rounded text-blue-600" />
              Has a fast EV charger
            </label>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-slate-600 font-bold text-xs">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save bay'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
