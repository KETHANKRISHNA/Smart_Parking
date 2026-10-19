import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Car,
  CreditCard,
  AlertCircle,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';

export const BookingConfirmationPage = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('pending_booking');
    if (!raw) {
      navigate('/search');
      return;
    }
    setBookingData(JSON.parse(raw));
  }, [navigate]);

  if (!bookingData) return null;

  const handleConfirmOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        locationId: bookingData.locationId,
        slotId: bookingData.slotId,
        vehicleNumber: bookingData.vehicleNumber,
        vehicleType: bookingData.vehicleType,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
      };

      const res = await api.post('/bookings', payload);
      if (res.success && res.data) {
        // Clear pending intent and route to payment
        sessionStorage.removeItem('pending_booking');
        navigate(`/payment?bookingId=${res.data.id}&ref=${res.data.bookingReference}`);
      }
    } catch (err) {
      setError(err.message || 'Could not complete booking reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-6">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Slot Selection
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        {/* Banner Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <span className="text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full">
            Review & Finalize
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
            Confirm Parking Reservation
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Review your time window and vehicle details before proceeding to payment.
          </p>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Location summary */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">{bookingData.locationName}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{bookingData.locationAddress}</p>
            </div>
          </div>

          {/* Bay and vehicle specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">RESERVED BAY</span>
              <strong className="text-lg font-black text-blue-700 font-mono">{bookingData.slotNumber}</strong>
              <div className="text-[10px] text-slate-500 capitalize">{bookingData.floorLevel}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">VEHICLE PLATE</span>
              <strong className="text-base font-bold text-slate-800 uppercase font-mono">{bookingData.vehicleNumber}</strong>
              <div className="text-[10px] text-slate-500 capitalize">{bookingData.vehicleType}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">ARRIVAL TIME</span>
              <strong className="text-sm font-bold text-slate-800">
                {new Date(bookingData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
              <div className="text-[10px] text-slate-500">{new Date(bookingData.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">EXIT WINDOW</span>
              <strong className="text-sm font-bold text-slate-800">
                {new Date(bookingData.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
              <div className="text-[10px] text-slate-500">{bookingData.totalHours} hrs duration</div>
            </div>
          </div>

          {/* Pricing Ledger */}
          <div className="border-t border-slate-200 pt-5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Slot base rate ({bookingData.totalHours} hours @ ₹{bookingData.hourlyRate}/hr)</span>
              <span>₹{bookingData.totalAmount}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform service fee</span>
              <span className="text-emerald-600 font-semibold">FREE (Demo)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Applicable GST / Taxes (Included)</span>
              <span>₹0.00</span>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
              <span className="font-bold text-slate-900 text-sm">Total Payable:</span>
              <span className="text-2xl font-black text-blue-700">₹{bookingData.totalAmount}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleConfirmOrder}
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Proceed to Payment Gateway
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
