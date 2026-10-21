import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export const NotFoundPage = () => {
  usePageTitle('Page not found');
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 max-w-md w-full text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            HTTP 404
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Page Not Found</h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            The parking route or page you are looking for has been moved or does not exist.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            to="/search"
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            Find Parking
          </Link>
        </div>
      </div>
    </div>
  );
};
