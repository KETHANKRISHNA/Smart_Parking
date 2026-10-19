import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Car,
  Bike,
  Zap,
  Clock,
  ArrowRight,
  Map as MapIcon,
  List as ListIcon,
  Sparkles,
  Building,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// Fix Leaflet marker icons in Vite
const customMarkerIcon = new L.DivIcon({
  className: 'custom-pin',
  html: `<div style="background-color: #1E3A8A; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">P</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
});

// Helper component to center map on selection
const MapRecenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13, { animate: true });
    }
  }, [center, map]);
  return null;
};

export const SearchParkingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('split'); // 'split' or 'list'

  // Filters state
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [vehicleType, setVehicleType] = useState('ALL');
  const [maxPrice, setMaxPrice] = useState(150);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        if (city) params.append('city', city);
        if (category) params.append('category', category);

        const res = await api.get(`/parking?${params.toString()}`);
        if (res.success && res.data) {
          setLocations(res.data);
          if (res.data.length > 0 && !selectedLocation) {
            setSelectedLocation(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching parking locations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [query, city, category]);

  // Client side filtering for price & availability
  const filteredLocations = locations.filter((loc) => {
    if (availableOnly && loc.availableSlots <= 0) return false;
    if (Number(loc.hourlyRate) > maxPrice) return false;
    return true;
  });

  const mapCenter = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : locations.length > 0
    ? [locations[0].latitude, locations[0].longitude]
    : [12.9716, 77.5946];

  const categories = [
    { label: 'All Places', value: '' },
    { label: 'Hospitals', value: 'HOSPITAL' },
    { label: 'Malls', value: 'MALL' },
    { label: 'Railway Stations', value: 'RAILWAY_STATION' },
    { label: 'Airports', value: 'AIRPORT' },
    { label: 'IT Parks', value: 'IT_PARK' },
    { label: 'Tourist Spots', value: 'TOURIST_SPOT' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Query input */}
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by facility name, address, or landmark..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
          </div>

          {/* City Selector */}
          <div className="w-full md:w-48">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="">All Cities</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('split')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'split' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Split Map and List View"
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Map & List</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Full List View"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">List Only</span>
            </button>
          </div>
        </div>

        {/* Category Filters Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold shrink-0">Category:</span>
          {categories.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                category === c.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Secondary filters: Available only toggle & Max Price */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-700">Available Slots Only</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">Max Rate:</span>
            <input
              type="range"
              min="20"
              max="200"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-28 accent-blue-600 cursor-pointer"
            />
            <span className="font-bold text-slate-900">₹{maxPrice}/hr</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        
        {/* Facilities List Column */}
        <div className={`${viewMode === 'split' ? 'lg:col-span-7' : 'w-full'} space-y-4`}>
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Found <strong className="text-slate-800">{filteredLocations.length}</strong> smart parking locations</span>
            <span>Sorted by popularity & availability</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-2xl bg-white border border-slate-200 p-4 animate-pulse" />
              ))}
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-700">No parking facilities match your search</h3>
              <p className="text-xs text-slate-400 mt-1">Try clearing filters or searching for another city.</p>
              <button
                onClick={() => { setQuery(''); setCity(''); setCategory(''); setAvailableOnly(false); setMaxPrice(150); }}
                className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedLocation(loc)}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer flex flex-col sm:flex-row gap-4 ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                        : 'border-slate-200/90 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-full sm:w-44 h-36 rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                      <img
                        src={loc.imageUrl}
                        alt={loc.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-white/95 text-slate-800 shadow-xs">
                        {loc.category.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base text-slate-900 leading-snug">
                            {loc.name}
                          </h3>
                          {loc.availableSlots > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {loc.availableSlots} Left
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              Full
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{loc.address}, {loc.city}</span>
                        </p>

                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {loc.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-slate-400">Hourly Rate</div>
                          <div className="text-base font-extrabold text-slate-900">
                            ₹{loc.hourlyRate} <span className="text-xs font-medium text-slate-500">/ hr</span>
                          </div>
                        </div>

                        <Link
                          to={`/parking/${loc.id}`}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-600/30 flex items-center gap-1.5 transition-all hover:scale-105"
                        >
                          Select Bay & Book
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Leaflet Map Column (Split view) */}
        {viewMode === 'split' && (
          <div className="lg:col-span-5 h-[580px] lg:h-[720px] sticky top-20 rounded-2xl overflow-hidden border border-slate-200 shadow-md">
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapRecenter center={mapCenter} />

              {filteredLocations.map((loc) => (
                <Marker
                  key={loc.id}
                  position={[loc.latitude, loc.longitude]}
                  icon={customMarkerIcon}
                  eventHandlers={{
                    click: () => setSelectedLocation(loc),
                  }}
                >
                  <Popup>
                    <div className="p-1 max-w-[200px]">
                      <h4 className="font-bold text-sm text-slate-900">{loc.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{loc.address}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                        <span className="font-extrabold text-blue-700 text-xs">₹{loc.hourlyRate}/hr</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {loc.availableSlots} slots left
                        </span>
                      </div>
                      <Link
                        to={`/parking/${loc.id}`}
                        className="mt-2 block w-full text-center py-1.5 bg-blue-600 text-white font-bold text-[11px] rounded-lg"
                      >
                        Book This Location
                      </Link>
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
