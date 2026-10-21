import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, Zap, AlertCircle, ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FormField } from '../components/common/FormField';
import { addHours, formatTime, nextQuarterHour, toLocalInputValue } from '../utils/datetime';
import { canUseBay, defaultVehicleFor, PLATE_PATTERN } from '../utils/vehicles';
import { pendingBooking } from '../utils/pendingBooking';

const SLOT_FILTERS = ['ALL', 'CAR', 'EV', 'BIKE', 'ACCESSIBLE'];
const VEHICLES = ['CAR', 'BIKE', 'EV'];

export const ParkingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [facility, setFacility] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');

  const [startTime, setStartTime] = useState(() => nextQuarterHour());
  const [durationHours, setDurationHours] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [slotTypeFilter, setSlotTypeFilter] = useState('ALL');

  const endTime = useMemo(() => addHours(startTime, durationHours), [startTime, durationHours]);
  const windowIsValid = Boolean(endTime);
  const minStart = toLocalInputValue(new Date());

  // Facility details load once per facility
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api
      .get(`/parking/${id}`, { signal: controller.signal })
      .then((res) => res.success && setFacility(res.data))
      .catch((err) => !controller.signal.aborted && setError(err.message || 'Failed to load this facility'))
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [id]);

  // Bay availability follows the chosen window. Debounced and cancelled so a slow, older response can never
  // overwrite a newer one while the slider or date is being changed.
  useEffect(() => {
    if (!windowIsValid) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSlotsLoading(true);
      api
        .get(`/parking/${id}/slots`, { params: { startTime, endTime }, signal: controller.signal })
        .then((res) => {
          if (!res.success) return;
          setSlots(res.data);
          // A bay that is no longer free for the new window must not stay selected
          setSelectedSlot((current) => {
            const fresh = current && res.data.find((s) => s.id === current.id);
            return fresh && fresh.status === 'AVAILABLE' && !fresh.bookedForWindow ? fresh : null;
          });
        })
        .catch((err) => !controller.signal.aborted && toast.error(err.message || 'Could not refresh bay availability'))
        .finally(() => !controller.signal.aborted && setSlotsLoading(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, startTime, endTime, windowIsValid, toast]);

  const isBayUnavailable = (slot) => slot.status !== 'AVAILABLE' || slot.bookedForWindow;

  const handleSlotSelect = (slot) => {
    if (isBayUnavailable(slot)) return;
    setSelectedSlot(slot);
    setVehicleType(defaultVehicleFor(slot.slotType));
  };

  const handleVehicleType = (type) => {
    setVehicleType(type);
    if (selectedSlot && !canUseBay(type, selectedSlot.slotType)) setSelectedSlot(null);
  };

  const handleProceedBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/parking/${id}` } } });
      return;
    }
    if (!windowIsValid) return toast.error('Please choose a valid arrival date and time.');
    if (new Date(startTime) < new Date(Date.now() - 5 * 60 * 1000)) return toast.error('Arrival time is in the past.');
    if (!selectedSlot) return toast.error('Please select an available parking bay.');
    const plate = vehicleNumber.trim().toUpperCase();
    if (!PLATE_PATTERN.test(plate)) return toast.error('Enter a valid vehicle registration number, e.g. KA-05-MH-2026.');

    pendingBooking.set({
      locationId: Number(id),
      locationName: facility.name,
      locationAddress: facility.address,
      slotId: selectedSlot.id,
      slotNumber: selectedSlot.slotNumber,
      floorLevel: selectedSlot.floorLevel,
      hourlyRate: selectedSlot.effectiveHourlyRate,
      startTime,
      endTime,
      totalHours: Number(durationHours),
      totalAmount: (Number(selectedSlot.effectiveHourlyRate) * Number(durationHours)).toFixed(2),
      vehicleNumber: plate,
      vehicleType,
    });
    navigate('/booking/confirm');
  };

  const filteredSlots = slots.filter((slot) => slotTypeFilter === 'ALL' || slot.slotType === slotTypeFilter);

  if (loading && !facility) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center" role="status" aria-label="Loading facility">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" aria-hidden="true" />
        <h1 className="text-xl font-bold text-slate-800">Facility not found</h1>
        <p className="text-xs text-slate-500 mt-1">{error || 'Could not load details'}</p>
        <Link to="/search" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Back to search
        </Link>
      </div>
    );
  }

  const rate = selectedSlot ? Number(selectedSlot.effectiveHourlyRate) : Number(facility.hourlyRate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Facility header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 h-64 lg:h-auto relative bg-gradient-to-br from-blue-100 to-slate-200">
          {facility.imageUrl && (
            <img
              src={facility.imageUrl}
              alt={facility.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/95 text-slate-900 shadow-md backdrop-blur-sm">
              {facility.category?.replaceAll('_', ' ')}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white drop-shadow-md">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              Hours: {facility.openingTime} - {facility.closingTime}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500 text-white">{facility.availableSlots} bays free</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{facility.name}</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                  <span>
                    {facility.address}, {facility.city}
                  </span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-slate-500 uppercase font-semibold">Standard rate</div>
                <div className="text-2xl font-black text-blue-700">
                  ₹{facility.hourlyRate} <span className="text-xs font-normal text-slate-500">/hr</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed">{facility.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-semibold">TOTAL CAPACITY</span>
                <strong className="text-slate-800 text-sm">{facility.totalSlots} bays</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-emerald-700 block text-[10px] font-semibold">FREE NOW</span>
                <strong className="text-emerald-800 text-sm">{facility.availableSlots} bays</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-semibold">OPEN</span>
                <strong className="text-slate-800 text-sm">
                  {facility.openingTime} – {facility.closingTime}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 block text-[10px] font-semibold">MANAGER</span>
                <strong className="text-slate-800 text-sm truncate block">{facility.managerName || 'On-site team'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Bay matrix */}
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6" aria-labelledby="bays-title">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 id="bays-title" className="text-lg font-bold text-slate-900">
                Select your parking bay
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Availability follows the arrival time and duration you choose.</p>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto" role="group" aria-label="Filter bays by type">
              {SLOT_FILTERS.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={slotTypeFilter === type}
                  onClick={() => setSlotTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${slotTypeFilter === type ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {type === 'EV' ? '⚡ EV' : type === 'ACCESSIBLE' ? '♿ Priority' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" />Available</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" />Occupied / booked</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300" />Out of service</span>
            <span className="flex items-center gap-1.5 ml-auto text-blue-600 font-bold"><span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-300" />Selected</span>
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2 transition-opacity ${slotsLoading ? 'opacity-60' : ''}`} aria-busy={slotsLoading}>
            {filteredSlots.length === 0 && !slotsLoading && (
              <p className="col-span-full text-center text-sm text-slate-500 py-8">No bays of this type at this facility.</p>
            )}
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const unavailable = isBayUnavailable(slot);
              const wrongVehicle = !unavailable && !canUseBay(vehicleType, slot.slotType);

              let style = 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:border-emerald-500 hover:shadow-md';
              let label = 'Available';
              if (slot.status === 'OUT_OF_SERVICE') {
                style = 'bg-slate-100 border-slate-200 text-slate-500';
                label = 'Maintenance';
              } else if (unavailable) {
                style = 'bg-rose-50/70 border-rose-200 text-rose-800';
                label = 'Taken';
              } else if (wrongVehicle) {
                style = 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300';
                label = `Not for ${vehicleType.toLowerCase()}`;
              }
              if (isSelected) style = 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-200 shadow-lg scale-[1.02]';

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={unavailable}
                  aria-pressed={isSelected}
                  aria-label={`Bay ${slot.slotNumber}, ${slot.slotType.toLowerCase()}, ${label}, ₹${slot.effectiveHourlyRate} per hour`}
                  onClick={() => handleSlotSelect(slot)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-32 relative text-left disabled:cursor-not-allowed ${style}`}
                >
                  <span className="flex w-full items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{slot.floorLevel}</span>
                    {slot.hasEvCharger && (
                      <span className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                        <Zap className="w-3 h-3 fill-current" aria-hidden="true" /> EV
                      </span>
                    )}
                  </span>
                  <span className="block text-center my-1 w-full">
                    <span className="block text-xl font-black font-mono tracking-tight">{slot.slotNumber}</span>
                    <span className={`block text-[10px] font-medium capitalize mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>{slot.slotType.toLowerCase()} bay</span>
                  </span>
                  <span className="flex w-full items-center justify-between text-[11px] pt-1 border-t border-black/5">
                    <span className="font-bold">₹{slot.effectiveHourlyRate}/h</span>
                    <span className="font-semibold text-[10px]">{isSelected ? 'Selected' : label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Reservation form */}
        <section className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 self-start lg:sticky lg:top-20" aria-labelledby="reservation-title">
          <div>
            <h2 id="reservation-title" className="text-base font-bold text-slate-900">Reservation details</h2>
            <p className="text-xs text-slate-500 mt-0.5">Choose when you arrive and how long you stay</p>
          </div>

          <div className="space-y-4">
            <FormField
              label="Arrival date & time"
              type="datetime-local"
              value={startTime}
              min={minStart}
              onChange={(e) => setStartTime(e.target.value)}
              error={!windowIsValid ? 'Choose a valid date and time' : undefined}
            />

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="duration" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Parking duration</label>
                <span className="text-xs font-bold text-blue-600">{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</span>
              </div>
              <input id="duration" type="range" min="1" max="12" step="1" value={durationHours} onChange={(e) => setDurationHours(Number(e.target.value))} className="w-full accent-blue-600 cursor-pointer" />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1" aria-hidden="true">
                <span>1 hr</span><span>4 hrs</span><span>8 hrs</span><span>12 hrs</span>
              </div>
            </div>

            <FormField
              label="Vehicle registration"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. KA-05-MH-2026"
              autoComplete="off"
              maxLength={13}
              className="[&_input]:uppercase"
            />

            <div>
              <span id="vehicle-class" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Vehicle type</span>
              <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="vehicle-class">
                {VEHICLES.map((vt) => (
                  <button
                    key={vt}
                    type="button"
                    aria-pressed={vehicleType === vt}
                    onClick={() => handleVehicleType(vt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${vehicleType === vt ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                  >
                    {vt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <dl className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <dt>Selected bay</dt>
              <dd className="font-bold text-slate-800">{selectedSlot ? selectedSlot.slotNumber : 'None selected'}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Rate per hour</dt>
              <dd className="font-bold text-slate-800">₹{rate}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Duration</dt>
              <dd className="font-bold text-slate-800">{durationHours} {durationHours === 1 ? 'hour' : 'hours'}</dd>
            </div>
            <div className="flex justify-between text-slate-500">
              <dt>Leave by</dt>
              <dd className="font-bold text-slate-800">{windowIsValid ? formatTime(endTime) : '—'}</dd>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <dt className="font-bold text-slate-800 text-sm">Estimated total</dt>
              <dd className="font-black text-xl text-blue-700">₹{(rate * durationHours).toFixed(2)}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={handleProceedBooking}
            disabled={!windowIsValid}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAuthenticated ? 'Review & continue' : 'Sign in to book'}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <p className="text-[11px] text-slate-500 text-center">Your bay is held for 15 minutes while you pay.</p>
        </section>
      </div>
    </div>
  );
};
