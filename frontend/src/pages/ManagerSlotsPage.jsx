import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Grid, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useManagerFacility } from '../hooks/useManagerFacility';
import { BayTile } from '../components/common/BayTile';
import { FacilityPicker } from '../components/common/FacilityPicker';

const TYPES = ['ALL', 'CAR', 'EV', 'BIKE', 'ACCESSIBLE'];

/** Bay inventory for the facility the signed-in manager operates (uses /manager endpoints, not /admin). */
export const ManagerSlotsPage = () => {
  const toast = useToast();
  const { facilities, facility, locationId, setLocationId, loading: facilitiesLoading, error: facilitiesError } = useManagerFacility();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState('ALL');

  const load = useCallback(async () => {
    if (!locationId) return;
    setError('');
    try {
      const res = await api.get('/manager/facility/slots', { params: { locationId } });
      setSlots(res.data);
    } catch (err) {
      setError(err.message || 'Could not load bays');
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
      load();
    } catch (err) {
      toast.error(err.message || 'Could not update the bay');
    }
  };

  const visible = useMemo(() => slots.filter((s) => type === 'ALL' || s.slotType === type), [slots, type]);

  if (facilitiesLoading || (loading && locationId)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center" role="status" aria-label="Loading bays">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (facilitiesError || !facility) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-2">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" aria-hidden="true" />
        <h1 className="text-lg font-bold text-slate-900">No facility assigned</h1>
        <p className="text-sm text-slate-600">{facilitiesError || 'An administrator needs to assign you to a parking facility first.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Bay inventory</h1>
          <p className="text-xs text-slate-500 mt-0.5">{facility.name}: take bays out of service for maintenance and bring them back</p>
        </div>
        <FacilityPicker facilities={facilities} value={locationId} onChange={setLocationId} />
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6" aria-labelledby="inventory-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h2 id="inventory-heading" className="font-bold text-base text-slate-900">Bays ({visible.length})</h2>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold" role="group" aria-label="Filter by bay type">
            {TYPES.map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-lg ${type === t ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}>
                {t === 'ALL' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {visible.map((s) => <BayTile key={s.id} slot={s} onToggle={handleToggle} />)}
        </div>
        {visible.length === 0 && <p className="text-center text-sm text-slate-500 py-6">No bays match this filter.</p>}
      </section>
    </div>
  );
};
