import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormField } from '../components/common/FormField';
import { usePageTitle } from '../hooks/usePageTitle';

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;

export const RegisterPage = () => {
  usePageTitle('Create account');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!PASSWORD_RULE.test(form.password)) {
      setFieldErrors({ password: 'Use 8 to 64 characters with at least one letter and one number.' });
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      setError(err.message || 'Registration failed');
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
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">Create an account</h1>
          <p className="text-xs text-slate-500 mt-1">Book parking in seconds. Free for drivers.</p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/50">
          {error && (
            <div role="alert" className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
            <FormField label="Full name" icon={User} name="name" autoComplete="name" required minLength={2} maxLength={100}
              value={form.name} onChange={handleChange} placeholder="e.g. Alex Morgan" error={fieldErrors.name} />
            <FormField label="Email address" icon={Mail} type="email" name="email" autoComplete="email" required
              value={form.email} onChange={handleChange} placeholder="you@example.com" error={fieldErrors.email} />
            <FormField label="Phone number (optional)" icon={Phone} type="tel" name="phone" autoComplete="tel"
              value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" error={fieldErrors.phone} />
            <FormField label="Password" icon={Lock} type="password" name="password" autoComplete="new-password" required
              value={form.password} onChange={handleChange} placeholder="At least 8 characters"
              hint="Use a letter and a number." error={fieldErrors.password} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Creating account" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" aria-hidden="true" />
                  Create account
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
