import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                P
              </div>
              <span className="text-lg font-bold text-white">SmartPark</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Find, Book, and Park Smartly at popular places with real-time slot availability, QR-based contactless gate entry, and transparent pricing.
            </p>
          </div>

          {/* Popular Locations */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Popular Hubs</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/search?category=HOSPITAL" className="hover:text-blue-400 transition-colors">Hospitals & Medical Centers</Link></li>
              <li><Link to="/search?category=MALL" className="hover:text-blue-400 transition-colors">Shopping Malls & Entertainment</Link></li>
              <li><Link to="/search?category=RAILWAY_STATION" className="hover:text-blue-400 transition-colors">Railway Stations & Metros</Link></li>
              <li><Link to="/search?category=AIRPORT" className="hover:text-blue-400 transition-colors">Airport Terminals (T1 & T2)</Link></li>
              <li><Link to="/search?category=IT_PARK" className="hover:text-blue-400 transition-colors">IT & Corporate Tech Parks</Link></li>
              <li><Link to="/search?category=TOURIST_SPOT" className="hover:text-blue-400 transition-colors">Tourist Spots & Monuments</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/search" className="hover:text-blue-400 transition-colors">Search Map & Slots</Link></li>
              <li><Link to="/bookings" className="hover:text-blue-400 transition-colors">My Bookings</Link></li>
              <li><Link to="/login" className="hover:text-blue-400 transition-colors">Driver Login</Link></li>
              <li><Link to="/register" className="hover:text-blue-400 transition-colors">Create an Account</Link></li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Architecture Stack</h4>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-blue-300 font-mono">React JS</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-emerald-300 font-mono">Spring Boot 3</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-indigo-300 font-mono">Spring Security</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-amber-300 font-mono">JWT Auth</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-cyan-300 font-mono">JPA / PostgreSQL</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-sky-300 font-mono">Flyway</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-rose-300 font-mono">Leaflet Maps</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-violet-300 font-mono">ZXing QR Engine</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              A full-stack Spring Boot REST API with a React single-page front end.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Smart Parking Management System. All rights reserved.</p>
          <p>Spring Boot &amp; React</p>
        </div>
      </div>
    </footer>
  );
};
