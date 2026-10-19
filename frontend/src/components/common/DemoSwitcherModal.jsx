import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ShieldCheck, UserCheck, KeyRound, X } from 'lucide-react';

export const DemoSwitcherModal = ({ isOpen, onClose }) => {
  const { demoLogin, user } = useAuth();

  if (!isOpen) return null;

  const handleSelectRole = async (roleType) => {
    try {
      await demoLogin(roleType);
      onClose();
    } catch (err) {
      alert('Demo login failed: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">1-Click Role Switcher</h3>
            <p className="text-xs text-slate-500">Instantly test the application across different authorized roles</p>
          </div>
        </div>

        <div className="space-y-3 my-4">
          {/* USER */}
          <button
            onClick={() => handleSelectRole('user')}
            className={`w-full flex items-start gap-4 p-3.5 rounded-xl border text-left transition-all ${
              user?.email === 'user@smartparking.com'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/20'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">Customer / Driver (ROLE_USER)</span>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded">User</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Search nearby parking, choose slot, simulate payment, get QR ticket pass.</p>
              <div className="text-[11px] text-slate-400 font-mono mt-1">user@smartparking.com • User@123</div>
            </div>
          </button>

          {/* ADMIN */}
          <button
            onClick={() => handleSelectRole('admin')}
            className={`w-full flex items-start gap-4 p-3.5 rounded-xl border text-left transition-all ${
              user?.email === 'admin@smartparking.com'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/20'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">System Administrator (ROLE_ADMIN)</span>
                <span className="text-[11px] bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded">Admin</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Analytics charts, manage parking locations, slots, users, and audit logs.</p>
              <div className="text-[11px] text-slate-400 font-mono mt-1">admin@smartparking.com • Admin@123</div>
            </div>
          </button>

          {/* PARKING MANAGER */}
          <button
            onClick={() => handleSelectRole('manager')}
            className={`w-full flex items-start gap-4 p-3.5 rounded-xl border text-left transition-all ${
              user?.email === 'manager@smartparking.com'
                ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/20'
                : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">Facility Manager (ROLE_PARKING_MANAGER)</span>
                <span className="text-[11px] bg-purple-100 text-purple-800 font-medium px-2 py-0.5 rounded">Manager</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Manage assigned facility, scan driver QR passes, handle gate entry & exit.</p>
              <div className="text-[11px] text-slate-400 font-mono mt-1">manager@smartparking.com • Manager@123</div>
            </div>
          </button>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
