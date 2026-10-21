import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { usePageTitle } from '../hooks/usePageTitle';

const CATEGORIES = [
  ['HOSPITAL', 'Hospital'],
  ['MALL', 'Mall'],
  ['RAILWAY_STATION', 'Railway station'],
  ['AIRPORT', 'Airport'],
  ['IT_PARK', 'IT park'],
  ['TOURIST_SPOT', 'Tourist spot'],
  ['COMMERCIAL_HUB', 'Commercial hub'],
  ['OTHER', 'Other'],
];

const EMPTY = {
  name: '',
  address: '',
  city: 'Bangalore',
  latitude: '12.9716',
  longitude: '77.5946',
  description: '',
  openingTime: '00:00',
  closingTime: '23:59',
  category: 'MALL',
  hourlyRate: '50',
  imageUrl: '',
  active: true,
  managerId: '',
};

const fromLocation = (loc) => ({
  name: loc.name,
  address: loc.address,
  city: loc.city,
  latitude: String(loc.latitude),
  longitude: String(loc.longitude),
  description: loc.description || '',
  openingTime: loc.openingTime || '00:00',
  closingTime: loc.closingTime || '23:59',
  category: loc.category,
  hourlyRate: String(loc.hourlyRate),
  imageUrl: loc.imageUrl || '',
  active: loc.active,
  managerId: loc.managerId ? String(loc.managerId) : '',
});

export const AdminLocationsPage = () => {
  usePageTitle('Facilities');
  const toast = useToast();
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [locs, users] = await Promise.all([api.get('/admin/locations'), api.get('/admin/users')]);
      setLocations(locs.data);
      setManagers(users.data.filter((u) => u.role === 'ROLE_PARKING_MANAGER' && u.enabled));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFieldErrors({});
    setShowModal(true);
  };

  const openEdit = (loc) => {
    setEditing(loc);
    setForm(fromLocation(loc));
    setFieldErrors({});
    setShowModal(true);
  };

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    const { managerId, ...rest } = form;
    const payload = {
      ...rest,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      hourlyRate: Number(form.hourlyRate),
      imageUrl: form.imageUrl.trim() || null,
    };
    try {
      const res = editing ? await api.put(`/admin/locations/${editing.id}`, payload) : await api.post('/admin/locations', payload);
      const saved = res.data;
      // Manager assignment has its own endpoint (and validates that the user really is a manager)
      if (managerId && Number(managerId) !== saved.managerId) {
        await api.post(`/admin/locations/${saved.id}/assign-manager/${managerId}`);
      }
      setShowModal(false);
      toast.success(editing ? 'Facility updated.' : 'Facility created.');
      load();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      toast.error(err.message || 'Could not save the facility');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (loc) => {
    try {
      await api.patch(`/admin/locations/${loc.id}/toggle-status`);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not update the status');
    }
  };

  const remove = async (loc) => {
    const ok = await toast.confirm({
      title: `Delete "${loc.name}"?`,
      message: 'This removes the facility and its bays. A facility with booking history cannot be deleted; deactivate it instead.',
      confirmLabel: 'Delete facility',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/locations/${loc.id}`);
      toast.success('Facility deleted.');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not delete the facility');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Parking facilities</h1>
          <p className="text-xs text-slate-500 mt-0.5">Create, edit, activate and assign managers to parking locations</p>
        </div>
        <button type="button" onClick={openCreate} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 self-start sm:self-auto">
          <Plus className="w-4 h-4" aria-hidden="true" /> Add facility
        </button>
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500" role="status">Loading facilities…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-4">Facility</th>
                  <th scope="col" className="py-3 px-4">Category</th>
                  <th scope="col" className="py-3 px-4">Bays</th>
                  <th scope="col" className="py-3 px-4">Free</th>
                  <th scope="col" className="py-3 px-4">Rate/hr</th>
                  <th scope="col" className="py-3 px-4">Manager</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{loc.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" aria-hidden="true" /> {loc.address}, {loc.city}</div>
                    </td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">{loc.category.replaceAll('_', ' ')}</span></td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{loc.totalSlots}</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{loc.availableSlots} free</span></td>
                    <td className="py-3.5 px-4 font-extrabold text-blue-700">₹{loc.hourlyRate}</td>
                    <td className="py-3.5 px-4 text-slate-600">{loc.managerName || <span className="text-amber-700">Unassigned</span>}</td>
                    <td className="py-3.5 px-4">
                      <button type="button" onClick={() => toggleStatus(loc)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${loc.active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}>
                        {loc.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={() => openEdit(loc)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" aria-label={`Edit ${loc.name}`}><Edit2 className="w-3.5 h-3.5" aria-hidden="true" /></button>
                        <button type="button" onClick={() => remove(loc)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg" aria-label={`Delete ${loc.name}`}><Trash2 className="w-3.5 h-3.5" aria-hidden="true" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {locations.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No facilities yet. Add the first one.</p>}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit parking facility' : 'Add parking facility'} size="max-w-xl" onClose={() => setShowModal(false)}>
          <form onSubmit={save} className="space-y-4">
            <FormField label="Facility name" name="name" required maxLength={150} value={form.name} onChange={setField} placeholder="e.g. Phoenix Marketcity Parking" error={fieldErrors.name} />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="City" name="city" required value={form.city} onChange={setField} error={fieldErrors.city} />
              <FormField label="Category" as="select" name="category" value={form.category} onChange={setField}>
                {CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </FormField>
            </div>
            <FormField label="Street address" name="address" required value={form.address} onChange={setField} placeholder="Street, area, landmark" error={fieldErrors.address} />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Hourly rate (₹)" type="number" name="hourlyRate" required min="0" step="any" value={form.hourlyRate} onChange={setField} error={fieldErrors.hourlyRate} />
              <FormField label="Latitude" type="number" name="latitude" required step="any" min="-90" max="90" value={form.latitude} onChange={setField} error={fieldErrors.latitude} />
              <FormField label="Longitude" type="number" name="longitude" required step="any" min="-180" max="180" value={form.longitude} onChange={setField} error={fieldErrors.longitude} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Opens" type="time" name="openingTime" value={form.openingTime} onChange={setField} />
              <FormField label="Closes" type="time" name="closingTime" value={form.closingTime} onChange={setField} />
            </div>
            <FormField label="Manager" as="select" name="managerId" value={form.managerId} onChange={setField} hint="Only users with the Parking manager role can be assigned.">
              <option value="">{editing?.managerId ? 'Keep current manager' : 'Unassigned'}</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
            </FormField>
            <FormField label="Image URL (optional)" type="url" name="imageUrl" value={form.imageUrl} onChange={setField} placeholder="https://…" error={fieldErrors.imageUrl} />
            <FormField label="Description" as="textarea" rows="3" name="description" value={form.description} onChange={setField} error={fieldErrors.description} />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" name="active" checked={form.active} onChange={setField} className="w-4 h-4 rounded text-blue-600" />
              Active (visible to drivers and bookable)
            </label>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/30 disabled:opacity-50">
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create facility'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
