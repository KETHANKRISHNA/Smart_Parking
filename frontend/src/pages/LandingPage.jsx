import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FacilityImage } from '../components/common/FacilityImage';
import { categoryOf } from '../utils/categories';
import {
  Search,
  MapPin,
  Calendar,
  CreditCard,
  QrCode,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  Building2,
  Plane,
  Train,
  ShoppingBag,
  Hospital,
  Camera
} from 'lucide-react';

export const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [featuredLocations, setFeaturedLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get('/parking');
        if (res.success && res.data) {
          setFeaturedLocations([...res.data].sort((a, b) => b.availableSlots - a.availableSlots).slice(0, 6));
          setCities([...new Set(res.data.map((l) => l.city))].sort());
          setStats({
            facilities: res.data.length,
            freeBays: res.data.reduce((sum, l) => sum + (l.availableSlots || 0), 0),
            cities: new Set(res.data.map((l) => l.city)).size,
          });
        }
      } catch (err) {
        console.warn('Could not load featured locations:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('query', searchQuery.trim());
    if (selectedCity) params.append('city', selectedCity);
    navigate(`/search?${params.toString()}`);
  };

  const categories = [
    { name: 'Hospitals', code: 'HOSPITAL', icon: Hospital, desc: 'Emergency triage & patient bays', color: 'bg-red-50 text-red-600 border-red-200' },
    { name: 'Malls', code: 'MALL', icon: ShoppingBag, desc: 'Shopping malls & cinema parking', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { name: 'Railway Stations', code: 'RAILWAY_STATION', icon: Train, desc: 'Direct platform connection', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { name: 'Airports', code: 'AIRPORT', icon: Plane, desc: 'Terminal 1 & 2 long-stay hubs', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { name: 'IT Parks', code: 'IT_PARK', icon: Building2, desc: 'Corporate tech-hub reserved lanes', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
    { name: 'Tourist Spots', code: 'TOURIST_SPOT', icon: Camera, desc: 'Heritage monuments & gardens', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  ];

  const steps = [
    { step: '01', title: 'Search Location', desc: 'Search parking near hospitals, malls, airports, or tourist spots.', icon: Search },
    { step: '02', title: 'Find Nearby Parking', desc: 'System displays nearby facilities with real-time available slots & map view.', icon: MapPin },
    { step: '03', title: 'Check Availability', desc: 'View live color-coded slot bay statuses (Available, Occupied, EV Charger).', icon: Clock },
    { step: '04', title: 'Book Slot', desc: 'Select your preferred vehicle type, bay number, and parking duration.', icon: Calendar },
    { step: '05', title: 'Make Payment', desc: 'Pay securely via UPI, Card, or NetBanking in seconds.', icon: CreditCard },
    { step: '06', title: 'QR Code Generated', desc: 'Receive an instant digital parking ticket pass with verification QR token.', icon: QrCode },
    { step: '07', title: 'Park & Exit', desc: 'Scan QR at gate entry and exit for completely seamless touchless parking.', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-950 via-slate-900 to-slate-900 text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Background glow decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Reserve a bay before you arrive</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            SMART PARKING <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              MANAGEMENT SYSTEM
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            Reserve a bay before you leave home. See live availability, pay online and walk in with a QR ticket.
          </p>

          {/* Search Bar Widget */}
          <div className="mt-10 max-w-3xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 text-slate-800 border border-slate-100"
            >
              <div className="flex-1 flex items-center gap-2.5 px-3 py-2 w-full">
                <Search className="w-5 h-5 text-blue-600 shrink-0" />
                <label htmlFor="hero-query" className="sr-only">Search parking</label>
                <input
                  id="hero-query"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hospital, mall, railway, airport..."
                  className="w-full text-sm font-medium focus:outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="h-8 w-px bg-slate-200 hidden sm:block" />

              <div className="w-full sm:w-44 flex items-center gap-2 px-3 py-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <label htmlFor="hero-city" className="sr-only">City</label>
                <select
                  id="hero-city"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="">All cities</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                Find Parking
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {featuredLocations.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-4">
                <span>Popular right now:</span>
                {featuredLocations.slice(0, 3).map((loc) => (
                  <Link key={loc.id} to={`/parking/${loc.id}`} className="hover:text-blue-300 underline underline-offset-4">{loc.name}</Link>
                ))}
              </div>
            )}

            {stats && (
              <dl className="mt-10 grid grid-cols-3 max-w-2xl mx-auto gap-3 sm:gap-6 text-center">
                {[
                  [stats.freeBays, 'bays free right now'],
                  [stats.facilities, 'parking facilities'],
                  [stats.cities, stats.cities === 1 ? 'city covered' : 'cities covered'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-white/5 border border-white/10 px-3 py-4 backdrop-blur-sm">
                    <dd className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">{value}</dd>
                    <dt className="text-[11px] sm:text-xs text-blue-200 mt-0.5">{label}</dt>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {/* 2. POPULAR LOCATIONS WE COVER (from Poster) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            High-Demand Destinations
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
            Popular Locations We Cover
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Pre-book guaranteed parking slots near top transit, healthcare, and commercial centers.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.code}
                to={`/search?category=${cat.code}`}
                className="group p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 transition-all text-center flex flex-col items-center justify-between"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 border ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                <span className="mt-3 text-[11px] font-semibold text-blue-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Bays <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED ACTIVE PARKING HUBS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Live Availability
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
              Featured Smart Facilities
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a facility to inspect real-time bay availability and reserve instantly.
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            Explore all facilities on map <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLocations.map((loc) => (
              <div
                key={loc.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-400 transition-all flex flex-col overflow-hidden group"
              >
                {/* Image */}
                <FacilityImage src={loc.imageUrl} category={loc.category} className="h-44" iconClass="w-14 h-14">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
                    {categoryOf(loc.category).label}
                  </span>
                  <span className="absolute bottom-3 left-3 text-white font-bold text-sm drop-shadow-md">{loc.city}</span>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden="true" />
                    {loc.availableSlots} free
                  </div>
                </FacilityImage>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                      {loc.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {loc.address}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                      {loc.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-500">Rate starting from</div>
                      <div className="text-base font-extrabold text-slate-900">
                        ₹{loc.hourlyRate} <span className="text-xs font-medium text-slate-500">/ hour</span>
                      </div>
                    </div>

                    <Link
                      to={`/parking/${loc.id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-600/30 transition-all hover:scale-105"
                    >
                      Book Slot
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. USER JOURNEY: 7 STEPS (Inspired by Poster User Journey) */}
      <section className="bg-slate-900 text-white py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-900/60 border border-blue-500/30 px-3 py-1 rounded-full">
              End-To-End Experience
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-3">
              How SmartPark Works
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              From discovering nearby parking to automated contactless gate exit in 7 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.slice(0, 4).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 relative flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-blue-500/40 font-mono">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
            {steps.slice(4).map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 relative flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-emerald-500/40 font-mono">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              Ready to park without the hassle?
            </h2>
            <p className="text-sm sm:text-base text-blue-100 font-medium leading-relaxed">
              Find an available slot near you in seconds. Reserve ahead, get a QR ticket, and enjoy touch-free gate entry.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/search"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-white text-blue-900 font-bold text-sm shadow-lg hover:bg-blue-50 transition-all hover:scale-105"
              >
                Find Nearby Parking
              </Link>
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-blue-950/40 hover:bg-blue-950/60 border border-white/20 text-white font-bold text-sm transition-all"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
