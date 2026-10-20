import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  User,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Car,
  KeyRound,
  Info
} from 'lucide-react';

export const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState('ROLE_ADMIN'); // Default to admin or allow quick toggle
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const roleConfigs = {
    ROLE_ADMIN: {
      title: 'System Administrator',
      subtitle: 'Executive operations, slot governance & full system control',
      badge: 'Admin Portal',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
      activeTab: 'bg-blue-600 text-white shadow-md shadow-blue-600/30',
      emailPlaceholder: 'admin@smartparking.com',
      buttonText: 'Sign In as System Administrator',
      buttonColor: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30',
      icon: ShieldCheck,
      iconColor: 'text-blue-600',
    },
    ROLE_PARKING_MANAGER: {
      title: 'Parking Facility Manager',
      subtitle: 'Slot occupancy supervision, QR gate validation & arrivals',
      badge: 'Manager Portal',
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
      activeTab: 'bg-purple-600 text-white shadow-md shadow-purple-600/30',
      emailPlaceholder: 'manager@smartparking.com',
      buttonText: 'Sign In as Facility Manager',
      buttonColor: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30',
      icon: Building2,
      iconColor: 'text-purple-600',
    },
    ROLE_USER: {
      title: 'Customer & Driver',
      subtitle: 'Real-time slot bookings, digital parking tickets & payments',
      badge: 'Driver Portal',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      activeTab: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30',
      emailPlaceholder: 'driver@example.com',
      buttonText: 'Sign In as Customer / Driver',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30',
      icon: Car,
      iconColor: 'text-emerald-600',
    },
  };

  const currentRole = roleConfigs[selectedRole];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);

      // Strict role verification based on chosen portal
      if (selectedRole === 'ROLE_ADMIN') {
        if (user.role !== 'ROLE_ADMIN') {
          logout();
          setError(`Access Denied: Account '${email}' does not hold System Administrator privileges. Current role: ${user.role.replace('ROLE_', '')}.`);
          return;
        }
        navigate('/admin/dashboard');
      } else if (selectedRole === 'ROLE_PARKING_MANAGER') {
        if (user.role !== 'ROLE_PARKING_MANAGER' && user.role !== 'ROLE_ADMIN') {
          logout();
          setError(`Access Denied: Account '${email}' does not hold Facility Manager privileges. Current role: ${user.role.replace('ROLE_', '')}.`);
          return;
        }
        navigate('/manager/dashboard');
      } else {
        // Customer portal
        if (user.role === 'ROLE_ADMIN') {
          navigate('/admin/dashboard');
        } else if (user.role === 'ROLE_PARKING_MANAGER') {
          navigate('/manager/dashboard');
        } else {
          navigate(from === '/login' ? '/dashboard' : from);
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            P
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to SmartPark
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Select your assigned role portal and enter your credentials to authenticate
          </p>
        </div>

        {/* Role Portal Selector Tabs */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Select Access Portal
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSelectedRole('ROLE_USER');
                setError('');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'ROLE_USER'
                  ? roleConfigs.ROLE_USER.activeTab
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('ROLE_PARKING_MANAGER');
                setError('');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'ROLE_PARKING_MANAGER'
                  ? roleConfigs.ROLE_PARKING_MANAGER.activeTab
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Manager</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedRole('ROLE_ADMIN');
                setError('');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                selectedRole === 'ROLE_ADMIN'
                  ? roleConfigs.ROLE_ADMIN.activeTab
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Portal Info Banner */}
        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-50 ${currentRole.iconColor}`}>
              <currentRole.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{currentRole.title}</div>
              <div className="text-[11px] text-slate-500">{currentRole.subtitle}</div>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${currentRole.badgeColor}`}>
            {currentRole.badge}
          </span>
        </div>

        {/* Card Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {selectedRole === 'ROLE_ADMIN'
                  ? 'Administrator Email'
                  : selectedRole === 'ROLE_PARKING_MANAGER'
                  ? 'Manager Email'
                  : 'Customer Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={currentRole.emailPlaceholder}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${currentRole.buttonColor}`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {currentRole.buttonText}
                </>
              )}
            </button>
          </form>

          {/* Access Instructions */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>How to gain Manager or Admin access:</span>
            </div>
            <p>
              • <strong>By Passcode:</strong> Register with your organization authorization code (<code className="text-blue-700 font-semibold">ADMIN2026</code> / <code className="text-purple-700 font-semibold">MANAGER2026</code>).
            </p>
            <p>
              • <strong>By Promotion:</strong> An existing System Administrator can elevate any user account via the <em>User Governance</em> console.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700">
                Register now
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
