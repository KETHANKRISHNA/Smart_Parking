import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Fuel, ShieldCheck, TrendingUp, Sparkles, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* System Benefits Banner (Inspired by Poster System Benefits) */}
      <div className="border-b border-slate-800/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Saves Time</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Instant booking & navigation</p>
            </div>

            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                <Fuel className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Saves Fuel</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">No circling busy parking lots</p>
            </div>

            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
                <Sparkles className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Reduces Congestion</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Smooth automated traffic flow</p>
            </div>

            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Better Space Utilization</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Dynamic bay occupancy</p>
            </div>

            <div className="col-span-2 md:col-span-1 flex flex-col items-center p-3 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Increases Revenue</h5>
              <p className="text-[11px] text-slate-400 mt-0.5">Cashless digital turnover</p>
            </div>
          </div>
        </div>
      </div>

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
            <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All systems operational (Spring Boot API + React)
            </div>
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
              <li><a href="http://localhost:8080/swagger-ui.html" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Swagger API Documentation</a></li>
              <li><a href="http://localhost:8080/h2-console" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Database Inspection Console</a></li>
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
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-cyan-300 font-mono">MySQL / JPA</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-rose-300 font-mono">Leaflet Maps</span>
              <span className="px-2 py-1 rounded bg-slate-800 text-[11px] text-violet-300 font-mono">ZXing QR Engine</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Designed for college major project presentations & full-stack development portfolios.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Smart Parking Management System. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with precision & passion</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mx-1" />
            <span>Full-Stack Spring Boot & React</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
