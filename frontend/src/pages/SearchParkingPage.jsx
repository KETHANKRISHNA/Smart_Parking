import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, ArrowRight, Map as MapIcon, List as ListIcon, AlertCircle, Locate } from 'lucide-react';
import api from '../services/api';

// A DivIcon avoids Leaflet's default marker images, which Vite cannot resolve
const markerIcon = new L.DivIcon({
  className: 'custom-pin',
  html: `<div style="background-color:#1E3A8A;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.3)">P</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

const CATEGORIES = [
  ['', 'All places'],
  ['HOSPITAL', 'Hospitals'],
  ['MALL', 'Malls'],
  ['RAILWAY_STATION', 'Railway stations'],
  ['AIRPORT', 'Airports'],
  ['IT_PARK', 'IT parks'],
  ['TOURIST_SPOT', 'Tourist spots'],
  ['COMMERCIAL_HUB', 'Commercial hubs'],
];
const PRICE_CAP = 200; // slider maximum; at the maximum there is no price limit
const DEFAULT_CENTER = [12.9716, 77.5946];

const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
};

const hasCoordinates = (loc) => Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude);

export const SearchParkingPage = () => {
  // The URL is the single source of truth for search filters, so shared links and footer links just work
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('query') || '';
  const city = searchParams.get('city') || '';
  const category = searchParams.get('category') || '';

  const [queryInput, setQueryInput] = useState(urlQuery);
  const [locations, setLocations] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [maxPrice, setMaxPrice] = useState(PRICE_CAP);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const setParam = (key, value) =>
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      return next;
    }, { replace: true });

  // Typing is debounced into the URL; the URL change triggers the fetch
  useEffect(() => {
    const timer = setTimeout(() => queryInput !== urlQuery && setParam('query', queryInput.trim()), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  useEffect(() => setQueryInput(urlQuery), [urlQuery]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .get('/parking', { params: { query: urlQuery || undefined, city: city || undefined, category: category || undefined }, signal: controller.signal })
      .then((res) => setLocations(res.data))
      .catch((err) => !controller.signal.aborted && setError(err.message || 'Could not load parking facilities'))
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [urlQuery, city, category]);

  // The city dropdown lists the cities that actually have facilities
  useEffect(() => {
    api.get('/parking').then((res) => setCities([...new Set(res.data.map((l) => l.city))].sort())).catch(() => {});
  }, []);

  const visible = useMemo(
    () =>
      locations
        .filter((l) => (!availableOnly || l.availableSlots > 0) && (maxPrice >= PRICE_CAP || Number(l.hourlyRate) <= maxPrice))
        .sort((a, b) => b.availableSlots - a.availableSlots || a.name.localeCompare(b.name)),
    [locations, availableOnly, maxPrice]
  );

  const selected = visible.find((l) => l.id === selectedId) || null;
  const mappable = visible.filter(hasCoordinates);
  const mapCenter = selected && hasCoordinates(selected) ? [selected.latitude, selected.longitude] : mappable[0] ? [mappable[0].latitude, mappable[0].longitude] : DEFAULT_CENTER;

  const resetFilters = () => {
    setSearchParams({}, { replace: true });
    setAvailableOnly(false);
    setMaxPrice(PRICE_CAP);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="sr-only">Find parking</h1>

      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <label htmlFor="search-query" className="sr-only">Search parking</label>
            <input
              id="search-query"
              type="search"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Search by facility name, address or landmark…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="search-city" className="sr-only">City</label>
            <select id="search-city" value={city} onChange={(e) => setParam('city', e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none cursor-pointer">
              <option value="">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto" role="group" aria-label="Results layout">
            <button type="button" aria-pressed={viewMode === 'split'} onClick={() => setViewMode('split')} className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'split' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              <MapIcon className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">Map &amp; list</span>
            </button>
            <button type="button" aria-pressed={viewMode === 'list'} onClick={() => setViewMode('list')} className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              <ListIcon className="w-4 h-4" aria-hidden="true" /><span className="hidden sm:inline">List only</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs" role="group" aria-label="Category">
          <span className="text-slate-500 font-semibold shrink-0">Category:</span>
          {CATEGORIES.map(([value, label]) => (
            <button key={value} type="button" aria-pressed={category === value} onClick={() => setParam('category', value)} className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${category === value ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer" />
            <span className="font-semibold text-slate-700">Only facilities with free bays</span>
          </label>
          <div className="flex items-center gap-3">
            <label htmlFor="max-rate" className="font-semibold">Max rate</label>
            <input id="max-rate" type="range" min="20" max={PRICE_CAP} step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-28 accent-blue-600 cursor-pointer" />
            <span className="font-bold text-slate-900 w-20">{maxPrice >= PRICE_CAP ? 'Any price' : `₹${maxPrice}/hr`}</span>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        <section className={`${viewMode === 'split' ? 'lg:col-span-7' : 'w-full'} space-y-4`} aria-label="Search results">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1" aria-live="polite">
            <span>Found <strong className="text-slate-800">{visible.length}</strong> parking {visible.length === 1 ? 'facility' : 'facilities'}</span>
            <span>Most free bays first</span>
          </div>

          {error && (
            <div role="alert" className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" /> {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-4" role="status" aria-label="Loading results">
              {[1, 2, 3].map((i) => <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 p-4 animate-pulse" />)}
            </div>
          ) : visible.length === 0 && !error ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" aria-hidden="true" />
              <h2 className="text-base font-bold text-slate-700">No parking facilities match your search</h2>
              <p className="text-xs text-slate-500 mt-1">Try clearing the filters or searching another city.</p>
              <button type="button" onClick={resetFilters} className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">Reset all filters</button>
            </div>
          ) : (
            <ul className="space-y-4">
              {visible.map((loc) => {
                const isSelected = selectedId === loc.id;
                return (
                  <li key={loc.id} className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row gap-4 ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200/90 hover:border-blue-300 hover:shadow-md'}`}>
                    <div className="w-full sm:w-44 h-36 rounded-xl overflow-hidden shrink-0 relative bg-gradient-to-br from-blue-100 to-slate-200">
                      {loc.imageUrl && <img src={loc.imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-slate-800 shadow-sm">{loc.category.replaceAll('_', ' ')}</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="font-bold text-base text-slate-900 leading-snug">{loc.name}</h2>
                          {loc.availableSlots > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">{loc.availableSlots} free</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">Full</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" /><span>{loc.address}, {loc.city}</span></p>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{loc.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[11px] text-slate-500">Hourly rate</div>
                          <div className="text-base font-extrabold text-slate-900">₹{loc.hourlyRate} <span className="text-xs font-medium text-slate-500">/ hr</span></div>
                        </div>
                        <div className="flex items-center gap-2">
                          {viewMode === 'split' && hasCoordinates(loc) && (
                            <button type="button" onClick={() => setSelectedId(loc.id)} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5" aria-label={`Show ${loc.name} on the map`}>
                              <Locate className="w-3.5 h-3.5" aria-hidden="true" /> Map
                            </button>
                          )}
                          <Link to={`/parking/${loc.id}`} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-600/30 flex items-center gap-1.5">
                            Select bay &amp; book <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {viewMode === 'split' && (
          <div className="lg:col-span-5 h-[580px] lg:h-[720px] lg:sticky lg:top-20 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
            <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="w-full h-full">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapRecenter center={mapCenter} />
              {mappable.map((loc) => (
                <Marker key={loc.id} position={[loc.latitude, loc.longitude]} icon={markerIcon} eventHandlers={{ click: () => setSelectedId(loc.id) }}>
                  <Popup>
                    <div className="p-1 max-w-[200px]">
                      <h3 className="font-bold text-sm text-slate-900">{loc.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{loc.address}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="font-extrabold text-blue-700 text-xs">₹{loc.hourlyRate}/hr</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{loc.availableSlots} free</span>
                      </div>
                      <Link to={`/parking/${loc.id}`} className="mt-2 block w-full text-center py-1.5 bg-blue-600 text-white font-bold text-[11px] rounded-lg">Book this facility</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
};
