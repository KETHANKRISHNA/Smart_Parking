import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const AccessDeniedPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 max-w-md w-full text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Access Denied</h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            You do not have the required administrative or manager credentials to view this protected zone.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            <Home className="w-4 h-4" />
            Home Page
          </Link>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
          >
            My Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
