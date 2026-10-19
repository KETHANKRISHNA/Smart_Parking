import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  MapPin,
  Clock,
  Car,
  Bike,
  Zap,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ArrowRight,
  Info,
  Check,
  Compass
} from 'lucide-react';

export const ParkingDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [location, setLocation] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reservation window state
  const now = new Date();
  now.setMinutes(now.getMinutes() + 15 - (now.getMinutes() % 15)); // round to next 15 min
  const defaultStartTime = now.toISOString().slice(0, 16);

  const [startTime, setStartTime] = useState(defaultStartTime);
  const [durationHours, setDurationHours] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [slotTypeFilter, setSlotTypeFilter] = useState('ALL');

  // Compute end time
  const getEndTime = () => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationHours * 60 * 60 * 1000);
    return end.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchLocationAndSlots = async () => {
      setLoading(true);
      setError('');
      try {
        const locRes = await api.get(`/parking/${id}`);
        if (locRes.success) {
          setLocation(locRes.data);
        }

        const endTimeStr = getEndTime();
        const slotsRes = await api.get(`/parking/${id}/slots?startTime=${startTime}&endTime=${endTimeStr}`);
        if (slotsRes.success) {
          setSlots(slotsRes.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load parking slots');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationAndSlots();
  }, [id, startTime, durationHours]);

  const handleSlotSelect = (slot) => {
    if (slot.status === 'OUT_OF_SERVICE' || slot.status === 'OCCUPIED' || slot.isBookedForWindow) {
      return;
    }
    setSelectedSlot(slot);
    if (slot.slotType === 'EV') setVehicleType('EV');
    else if (slot.slotType === 'BIKE') setVehicleType('BIKE');
    else setVehicleType('CAR');
  };

  const handleProceedBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/parking/${id}` } } });
      return;
    }

    if (!selectedSlot) {
      alert('Please select an available parking bay');
      return;
    }

    if (!vehicleNumber.trim()) {
      alert('Please enter your vehicle license plate number');
      return;
    }

    // Save temporary booking intent and navigate to confirmation
    const bookingPayload = {
      locationId: Number(id),
      locationName: location.name,
      locationAddress: location.address,
      slotId: selectedSlot.id,
      slotNumber: selectedSlot.slotNumber,
      floorLevel: selectedSlot.floorLevel,
      hourlyRate: selectedSlot.effectiveHourlyRate,
      startTime: startTime,
      endTime: getEndTime(),
      totalHours: Number(durationHours),
      totalAmount: (Number(selectedSlot.effectiveHourlyRate) * Number(durationHours)).toFixed(2),
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType: vehicleType,
    };

    sessionStorage.setItem('pending_booking', JSON.stringify(bookingPayload));
    navigate('/booking/confirm');
  };

  const filteredSlots = slots.filter((slot) => {
    if (slotTypeFilter === 'ALL') return true;
    return slot.slotType === slotTypeFilter;
  });

  if (loading && !location) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !location) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Facility Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">{error || 'Could not load details'}</p>
        <Link to="/search" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Facility Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 h-64 lg:h-auto relative bg-slate-100">
          <img
            src={location.imageUrl}
            alt={location.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white/95 text-slate-900 shadow-md backdrop-blur-xs">
              {location.category.replace('_', ' ')}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white drop-shadow-md">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Hours: {location.openingTime} - {location.closingTime}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500 text-white">
              {location.availableSlots} Bays Available
            </span>
          </div>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {location.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{location.address}, {location.city}</span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Standard Rate</div>
                <div className="text-2xl font-black text-blue-700">
                  ₹{location.hourlyRate} <span className="text-xs font-normal text-slate-500">/hr</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed">
              {location.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">TOTAL CAPACITY</span>
                <strong className="text-slate-800 text-sm">{location.totalSlots} Slots</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-emerald-600 block text-[10px] font-semibold">LIVE AVAILABLE</span>
                <strong className="text-emerald-700 text-sm">{location.availableSlots} Available</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">SECURITY</span>
                <strong className="text-slate-800 text-sm">24/7 CCTV & Valet</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-semibold">MANAGER</span>
                <strong className="text-slate-800 text-sm truncate block">{location.managerName || 'On-site'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Booking & Visual Bay Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Interactive Slot Matrix (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select Your Parking Bay</h2>
              <p className="text-xs text-slate-500 mt-0.5">Click any green bay to reserve. Color states update live based on your selected reservation time window.</p>
            </div>

            {/* Vehicle Type Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
              {['ALL', 'CAR', 'EV', 'BIKE', 'ACCESSIBLE'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSlotTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    slotTypeFilter === type
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type === 'EV' ? '⚡ EV' : type === 'ACCESSIBLE' ? '♿ Priority' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Color legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              Occupied / Booked
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              Out of Service
            </span>
            <span className="flex items-center gap-1.5 ml-auto text-blue-600 font-bold">
              <span className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-blue-300" />
              Selected
            </span>
          </div>

          {/* Visual Parking Slot Grid Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3.5 pt-2">
            {filteredSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const isUnavailable =
                slot.status === 'OUT_OF_SERVICE' ||
                slot.status === 'OCCUPIED' ||
                slot.isBookedForWindow;

              let slotStyle = 'bg-emerald-50/80 border-emerald-300 text-emerald-950 hover:border-emerald-500 hover:shadow-md cursor-pointer';
              let statusLabel = 'Available';

              if (slot.status === 'OUT_OF_SERVICE') {
                slotStyle = 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed';
                statusLabel = 'Maintenance';
              } else if (slot.status === 'OCCUPIED' || slot.isBookedForWindow) {
                slotStyle = 'bg-rose-50/70 border-rose-200 text-rose-800 cursor-not-allowed';
                statusLabel = 'Occupied';
              } else if (slot.status === 'RESERVED') {
                slotStyle = 'bg-amber-50 border-amber-200 text-amber-800 cursor-not-allowed';
                statusLabel = 'Reserved';
              }

              if (isSelected) {
                slotStyle = 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-200 shadow-lg scale-102';
              }

              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotSelect(slot)}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between h-32 relative ${slotStyle}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {slot.floorLevel}
                    </span>
                    {slot.hasEvCharger && (
                      <span className={`p-1 rounded-md text-[10px] font-bold flex items-center gap-0.5 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        <Zap className="w-3 h-3 fill-current" /> EV
                      </span>
                    )}
                  </div>

                  {/* Slot Number */}
                  <div className="text-center my-1">
                    <div className="text-xl font-black font-mono tracking-tight">
                      {slot.slotNumber}
                    </div>
                    <div className={`text-[10px] font-medium capitalize mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                      {slot.slotType.toLowerCase()} bay
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5">
                    <span className="font-bold">₹{slot.effectiveHourlyRate}/h</span>
                    <span className="font-semibold text-[10px]">{isSelected ? 'Selected' : statusLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Reservation Config & Fare Calculator (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 self-start sticky top-20">
          <div>
            <h3 className="text-base font-bold text-slate-900">Reservation Details</h3>
            <p className="text-xs text-slate-500 mt-0.5">Customize time interval & license plate</p>
          </div>

          <div className="space-y-4">
            {/* Arrival Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Arrival Date & Time
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Duration Slider / Selector */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Parking Duration
                </label>
                <span className="text-xs font-bold text-blue-600">{durationHours} Hours</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 hr</span>
                <span>4 hrs</span>
                <span>8 hrs</span>
                <span>12 hrs</span>
              </div>
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vehicle Registration #
              </label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KA-05-MH-2026"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 placeholder:normal-case placeholder:font-normal"
              />
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Vehicle Classification
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['CAR', 'BIKE', 'EV'].map((vt) => (
                  <button
                    key={vt}
                    type="button"
                    onClick={() => setVehicleType(vt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      vehicleType === vt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {vt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Fare Summary Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Selected Bay:</span>
              <strong className="text-slate-800">{selectedSlot ? selectedSlot.slotNumber : 'None Selected'}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Rate per hour:</span>
              <strong className="text-slate-800">₹{selectedSlot ? selectedSlot.effectiveHourlyRate : location.hourlyRate}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Reserved duration:</span>
              <strong className="text-slate-800">{durationHours} hours</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Exit window:</span>
              <strong className="text-slate-800">{new Date(getEndTime()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-800 text-sm">Estimated Total:</span>
              <span className="font-black text-xl text-blue-700">
                ₹{selectedSlot ? (selectedSlot.effectiveHourlyRate * durationHours).toFixed(2) : (location.hourlyRate * durationHours).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Reserve Button */}
          <button
            onClick={handleProceedBooking}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            Confirm & Proceed to Payment
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
