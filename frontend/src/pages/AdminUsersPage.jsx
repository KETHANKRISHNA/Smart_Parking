import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, ShieldCheck, ShieldAlert, Car, Search, UserPlus, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal } from '../components/common/Modal';
import { FormField } from '../components/common/FormField';
import { usePageTitle } from '../hooks/usePageTitle';

const ROLE_LABEL = { ROLE_USER: 'Customer', ROLE_PARKING_MANAGER: 'Parking manager', ROLE_ADMIN: 'Administrator' };
const ROLE_STYLE = {
  ROLE_ADMIN: 'bg-blue-100 text-blue-800',
  ROLE_PARKING_MANAGER: 'bg-purple-100 text-purple-800',
  ROLE_USER: 'bg-emerald-100 text-emerald-800',
};
const EMPTY_FORM = { name: '', email: '', password: '', phone: '', role: 'ROLE_PARKING_MANAGER' };

export const AdminUsersPage = () => {
  usePageTitle('Users');
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (u, role) => {
    if (role === u.role) return;
    const ok = await toast.confirm({
      title: `Change ${u.name}'s role?`,
      message: `${ROLE_LABEL[u.role]} → ${ROLE_LABEL[role]}. The change applies on their next request.`,
      confirmLabel: 'Change role',
      danger: role === 'ROLE_ADMIN',
    });
    if (!ok) return;
    try {
      await api.patch(`/admin/users/${u.id}/role`, { role });
      toast.success(`${u.name} is now ${ROLE_LABEL[role].toLowerCase()}.`);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not change the role');
    }
  };

  const toggleStatus = async (u) => {
    if (u.enabled) {
      const ok = await toast.confirm({
        title: `Disable ${u.name}?`,
        message: 'They will be signed out and unable to log in until you enable the account again.',
        confirmLabel: 'Disable account',
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await api.patch(`/admin/users/${u.id}/toggle-status`);
      toast.success(`${u.name} is now ${u.enabled ? 'disabled' : 'enabled'}.`);
      load();
    } catch (err) {
      toast.error(err.message || 'Could not update the account');
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await api.post('/admin/users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        role: form.role,
      });
      setShowAdd(false);
      setForm(EMPTY_FORM);
      toast.success(`${ROLE_LABEL[form.role]} account created.`);
      load();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      toast.error(err.message || 'Could not create the account');
    } finally {
      setSaving(false);
    }
  };

  const setField = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => !q || [u.name, u.email, u.phone].some((v) => v?.toLowerCase().includes(q)));
  }, [users, search]);

  const count = (role) => users.filter((u) => u.role === role).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Create staff accounts, change roles and disable access. Staff accounts can only be created here.</p>
        </div>
        <button type="button" onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 self-start sm:self-auto">
          <UserPlus className="w-4 h-4" aria-hidden="true" /> Add account
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total accounts', value: users.length, icon: Users, tone: 'border-slate-200/90 text-slate-900' },
          { label: 'Administrators', value: count('ROLE_ADMIN'), icon: ShieldCheck, tone: 'border-blue-200 text-blue-900' },
          { label: 'Facility managers', value: count('ROLE_PARKING_MANAGER'), icon: ShieldAlert, tone: 'border-purple-200 text-purple-900' },
          { label: 'Customers', value: count('ROLE_USER'), icon: Car, tone: 'border-emerald-200 text-emerald-900' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`bg-white p-4 rounded-2xl border shadow-sm ${tone}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600">{label}</span>
              <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <div className="text-2xl font-extrabold">{value}</div>
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <label htmlFor="user-search" className="sr-only">Search users</label>
          <input id="user-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email or phone…" className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500" role="status">Loading user accounts…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th scope="col" className="py-3 px-4">User</th>
                  <th scope="col" className="py-3 px-4">Phone</th>
                  <th scope="col" className="py-3 px-4">Role</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4">Registered</th>
                  <th scope="col" className="py-3 px-4 text-right">Change role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((u) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.name}{isMe && <span className="ml-1.5 text-[11px] font-semibold text-blue-600">(you)</span>}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{u.phone || '—'}</td>
                      <td className="py-3.5 px-4"><span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${ROLE_STYLE[u.role]}`}>{ROLE_LABEL[u.role]}</span></td>
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(u)}
                          disabled={isMe}
                          title={isMe ? 'You cannot disable your own account' : undefined}
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${u.enabled ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                        >
                          {u.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">{new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="py-3.5 px-4 text-right">
                        <label className="sr-only" htmlFor={`role-${u.id}`}>Role for {u.name}</label>
                        <select
                          id={`role-${u.id}`}
                          value={u.role}
                          disabled={isMe}
                          onChange={(e) => changeRole(u, e.target.value)}
                          title={isMe ? 'You cannot change your own role' : undefined}
                          className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-bold cursor-pointer hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {Object.entries(ROLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="p-8 text-center text-sm text-slate-500">No users match your search.</p>}
          </div>
        )}
      </div>

      {showAdd && (
        <Modal title="Add account" size="max-w-md" onClose={() => setShowAdd(false)}>
          <form onSubmit={createUser} className="space-y-3">
            <FormField label="Full name" name="name" required value={form.name} onChange={setField} placeholder="e.g. David Miller" error={fieldErrors.name} />
            <FormField label="Email address" type="email" name="email" required value={form.email} onChange={setField} placeholder="staff@example.com" error={fieldErrors.email} />
            <FormField label="Phone (optional)" type="tel" name="phone" value={form.phone} onChange={setField} placeholder="+91 98765 00000" error={fieldErrors.phone} />
            <FormField label="Temporary password" type="password" name="password" required autoComplete="new-password" value={form.password} onChange={setField} hint="8+ characters with a letter and a number." error={fieldErrors.password} />
            <FormField label="Role" as="select" name="role" value={form.role} onChange={setField}>
              {Object.entries(ROLE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </FormField>
            <div className="pt-3 flex gap-2">
              <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 disabled:opacity-50">
                {saving ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
