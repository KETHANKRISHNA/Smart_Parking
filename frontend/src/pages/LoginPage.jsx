import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormField } from '../components/common/FormField';
import { usePageTitle } from '../hooks/usePageTitle';

const homeFor = (role) => {
  if (role === 'ROLE_ADMIN') return '/admin/dashboard';
  if (role === 'ROLE_PARKING_MANAGER') return '/manager/dashboard';
  return '/dashboard';
};

export const LoginPage = () => {
  usePageTitle('Sign in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requested = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      // Customers return to the page they were sent from; staff land on their own console.
      navigate(user.role === 'ROLE_USER' && requested ? requested : homeFor(user.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30" aria-hidden="true">
            P
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to SmartPark</h1>
          <p className="text-xs text-slate-500 mt-1">Customers, facility managers and administrators all sign in here.</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          {error && (
            <div role="alert" className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              icon={Mail}
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <FormField
              label="Password"
              icon={Lock}
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Signing in" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-bold text-blue-600 hover:text-blue-700">
                Register now
              </Link>
            </p>
            <p className="mt-2 text-[11px] text-slate-400">Facility manager or admin accounts are created by an administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
