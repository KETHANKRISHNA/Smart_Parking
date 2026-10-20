import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Car,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  KeyRound,
  AlertCircle,
  X
} from 'lucide-react';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'ROLE_PARKING_MANAGER',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole, userName) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setFeedback({
        text: `Successfully updated ${userName}'s role to ${newRole.replace('ROLE_', '')}!`,
        type: 'success',
      });
      fetchUsers();
      setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      setFeedback({
        text: 'Failed to update role: ' + (err.message || 'Unknown error'),
        type: 'error',
      });
    }
  };

  const handleToggleStatus = async (userId, userName) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      setFeedback({
        text: `Successfully toggled account status for ${userName}`,
        type: 'success',
      });
      fetchUsers();
      setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      setFeedback({
        text: 'Failed to toggle status: ' + (err.message || 'Unknown error'),
        type: 'error',
      });
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      await api.post('/auth/register', {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        phone: addForm.phone.trim(),
        role: addForm.role,
      });

      setShowAddModal(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'ROLE_PARKING_MANAGER',
      });
      setFeedback({
        text: `Created new staff account (${addForm.role.replace('ROLE_', '')}) successfully!`,
        type: 'success',
      });
      fetchUsers();
      setTimeout(() => setFeedback({ text: '', type: '' }), 4000);
    } catch (err) {
      setAddError(err.message || 'Failed to create staff account');
    } finally {
      setAddLoading(false);
    }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'ROLE_ADMIN').length;
  const managerCount = users.filter((u) => u.role === 'ROLE_PARKING_MANAGER').length;
  const customerCount = users.filter((u) => u.role === 'ROLE_USER').length;

  return (
    <div className="space-y-6">
      
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Account Governance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user privileges, promote accounts to Manager or Administrator, and provision staff credentials
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Staff Account</span>
        </button>
      </div>

      {/* Role Distribution Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Accounts</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalUsers}</div>
          <span className="text-[10px] text-slate-400">All registered users</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-700">Administrators</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-blue-900">{adminCount}</div>
          <span className="text-[10px] text-blue-600 font-medium">Full governance rights</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-purple-700">Facility Managers</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-900">{managerCount}</div>
          <span className="text-[10px] text-purple-600 font-medium">Bays & gate operations</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-700">Customers / Drivers</span>
            <Car className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900">{customerCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Standard reservations</span>
        </div>
      </div>

      {/* Role Elevation Instructions Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Role Assignment & Privilege Elevation:</span>
          <p className="text-[11px] text-slate-600 mt-0.5">
            To grant a user access to the <strong>Admin Console</strong> or <strong>Manager Gate Portal</strong>, select their new role in the <em>Role Changer</em> dropdown column. The change is saved instantly in the database, allowing the user to sign in immediately using their email and password.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.text && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback({ text: '', type: '' })} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:bg-white"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading user accounts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Role Changer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ROLE_ADMIN'
                          ? 'bg-blue-100 text-blue-800'
                          : u.role === 'ROLE_PARKING_MANAGER'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {u.role.replace('ROLE_', '')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.name)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                          u.enabled
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {u.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value, u.name)}
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-bold cursor-pointer hover:border-blue-500 transition-colors"
                      >
                        <option value="ROLE_USER">Customer (User)</option>
                        <option value="ROLE_PARKING_MANAGER">Parking Manager</option>
                        <option value="ROLE_ADMIN">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Provision Staff Account</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. David Miller"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="staff@smartparking.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="+91 98765 00000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Temporary password (min 6 chars)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Role Permission
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white"
                >
                  <option value="ROLE_PARKING_MANAGER">Parking Facility Manager</option>
                  <option value="ROLE_ADMIN">System Administrator</option>
                  <option value="ROLE_USER">Customer (Driver)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {addLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
