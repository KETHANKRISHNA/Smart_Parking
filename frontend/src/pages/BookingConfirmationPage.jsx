import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, AlertCircle, ChevronLeft } from 'lucide-react';
import api from '../services/api';
import { pendingBooking } from '../utils/pendingBooking';
import { formatDateTime, formatTime } from '../utils/datetime';

export const BookingConfirmationPage = () => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const draft = pendingBooking.get();
    if (!draft) {
      navigate('/search', { replace: true });
      return;
    }
    setBookingData(draft);
  }, [navigate]);

  if (!bookingData) return null;

  const handleConfirmOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/bookings', {
        locationId: bookingData.locationId,
        slotId: bookingData.slotId,
        vehicleNumber: bookingData.vehicleNumber,
        vehicleType: bookingData.vehicleType,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
      });
      if (res.success && res.data) {
        pendingBooking.clear();
        navigate(`/payment?bookingId=${res.data.id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Could not complete the reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        Back to bay selection
      </button>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
          <span className="text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full">Review &amp; confirm</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">Confirm your reservation</h1>
          <p className="text-xs text-blue-200 mt-1">Check the details below. Your bay is held for 15 minutes once you continue, while you pay.</p>
        </div>

        {error && (
          <div role="alert" className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">{bookingData.locationName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{bookingData.locationAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Bay</span>
              <strong className="text-lg font-black text-blue-700 font-mono">{bookingData.slotNumber}</strong>
              <div className="text-[10px] text-slate-500 capitalize">{bookingData.floorLevel}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Vehicle</span>
              <strong className="text-base font-bold text-slate-800 uppercase font-mono">{bookingData.vehicleNumber}</strong>
              <div className="text-[10px] text-slate-500 capitalize">{bookingData.vehicleType?.toLowerCase()}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Arrive</span>
              <strong className="text-sm font-bold text-slate-800">{formatTime(bookingData.startTime)}</strong>
              <div className="text-[10px] text-slate-500">{formatDateTime(bookingData.startTime).split(',')[0]}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Leave by</span>
              <strong className="text-sm font-bold text-slate-800">{formatTime(bookingData.endTime)}</strong>
              <div className="text-[10px] text-slate-500">{bookingData.totalHours} hr stay</div>
            </div>
          </div>

          <dl className="border-t border-slate-200 pt-5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <dt>Parking ({bookingData.totalHours} hrs @ ₹{bookingData.hourlyRate}/hr)</dt>
              <dd>₹{bookingData.totalAmount}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Booking fee</dt>
              <dd>₹0.00</dd>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
              <dt className="font-bold text-slate-900 text-sm">Total payable</dt>
              <dd className="text-2xl font-black text-blue-700">₹{bookingData.totalAmount}</dd>
            </div>
          </dl>
          <p className="text-[11px] text-slate-500">
            The final amount is calculated by the server when you continue. Cancel at least one hour before arrival for a full refund.
          </p>

          <button
            type="button"
            onClick={handleConfirmOrder}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Reserving" />
            ) : (
              <>
                <CreditCard className="w-4 h-4" aria-hidden="true" />
                Reserve &amp; continue to payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
