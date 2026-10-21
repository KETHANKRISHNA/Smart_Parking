import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QrCode, Download, MapPin, AlertTriangle, ArrowLeft, Navigation, Printer, CreditCard, Hourglass } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { FormField } from '../components/common/FormField';
import { formatDateTime, formatTime } from '../utils/datetime';

const REASONS = ['Change of plans', 'Found alternative parking', 'Booking date/time mistake', 'Vehicle issue'];

export const BookingTicketPage = () => {
  const { id } = useParams();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);

  useEffect(() => {
    api
      .get(`/bookings/${id}`)
      .then((res) => res.success && setBooking(res.data))
      .catch((err) => setError(err.message || 'Could not load ticket'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!showCancel) return undefined;
    const onKey = (e) => e.key === 'Escape' && setShowCancel(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showCancel]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.post(`/bookings/${id}/cancel`, { reason });
      if (res.success) {
        // The cancel response is the light view (no QR), so refresh the full booking
        const fresh = await api.get(`/bookings/${id}`);
        setBooking(fresh.data);
        setShowCancel(false);
        toast.success('Booking cancelled.');
      }
    } catch (err) {
      toast.error(err.message || 'Cancellation failed');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadQr = () => {
    if (!booking?.qrCodeBase64) return;
    const link = document.createElement('a');
    link.href = booking.qrCodeBase64;
    link.download = `SmartPark-${booking.bookingReference}-QR.png`;
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading ticket">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-2" aria-hidden="true" />
        <h1 className="text-xl font-bold text-slate-800">Ticket not found</h1>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <Link to="/bookings" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">Back to bookings</Link>
      </div>
    );
  }

  const hasTicket = booking.status === 'CONFIRMED' || booking.status === 'COMPLETED';
  const unpaid = booking.status === 'PENDING_PAYMENT';
  const cancellable = (booking.status === 'CONFIRMED' || unpaid) && !booking.entryTime;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link to="/bookings" className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> My bookings
        </Link>
        {hasTicket && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => window.print()} className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 border border-slate-200">
              <Printer className="w-3.5 h-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Print pass</span>
            </button>
            <button type="button" onClick={handleDownloadQr} className="p-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 border border-blue-200">
              <Download className="w-3.5 h-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Save QR</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden print:border-none print:shadow-none">
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded">Digital parking pass</span>
            <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">{booking.locationName}</h1>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400 shrink-0" aria-hidden="true" />
              <span>{booking.locationAddress}, {booking.locationCity}</span>
            </p>
          </div>
          <div className="text-right">
            <StatusBadge status={booking.status} />
            <div className="mt-2 text-xs font-mono font-bold text-slate-300">{booking.bookingReference}</div>
          </div>
        </div>

        <div className="p-6 sm:p-8 text-center bg-slate-50/50 border-b border-slate-100 flex flex-col items-center">
          {hasTicket && booking.qrCodeBase64 ? (
            <>
              <div className="bg-white p-4 rounded-3xl border-2 border-slate-200/80 shadow-md inline-block">
                <img src={booking.qrCodeBase64} alt={`QR code for booking ${booking.bookingReference}`} className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl" />
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-4 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" aria-hidden="true" /> Scan this code at the entry and exit gates
              </p>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">{booking.qrToken}</div>
            </>
          ) : unpaid ? (
            <div className="py-4 space-y-3">
              <Hourglass className="w-10 h-10 text-amber-500 mx-auto" aria-hidden="true" />
              <p className="font-bold text-slate-900">Payment pending</p>
              <p className="text-xs text-slate-500 max-w-xs">Your bay is held until {formatTime(booking.holdExpiresAt)}. Your QR ticket is issued once payment completes.</p>
              <Link to={`/payment?bookingId=${booking.id}`} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30">
                <CreditCard className="w-4 h-4" aria-hidden="true" /> Pay ₹{booking.totalAmount}
              </Link>
            </div>
          ) : (
            <div className="py-6 space-y-1">
              <p className="font-bold text-slate-900">No ticket for this booking</p>
              <p className="text-xs text-slate-500">{booking.cancellationReason || `This booking is ${booking.status.toLowerCase()}.`}</p>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Bay</span>
              <strong className="text-xl font-black text-blue-700 font-mono">{booking.slotNumber}</strong>
              <div className="text-[10px] text-slate-500 capitalize">{booking.floorLevel}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Vehicle</span>
              <strong className="text-sm font-bold text-slate-800 uppercase font-mono">{booking.vehicleNumber}</strong>
              <div className="text-[10px] text-slate-500 capitalize">{booking.vehicleType?.toLowerCase()}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Start</span>
              <strong className="text-xs font-bold text-slate-800">{formatTime(booking.startTime)}</strong>
              <div className="text-[10px] text-slate-500">{formatDateTime(booking.startTime).split(',')[0]}</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">End</span>
              <strong className="text-xs font-bold text-slate-800">{formatTime(booking.endTime)}</strong>
              <div className="text-[10px] text-slate-500">{booking.totalHours} hrs · ₹{booking.totalAmount}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs">
            <h2 className="font-bold text-blue-900 text-xs uppercase tracking-wider">Gate activity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block text-[11px]">Entry scan</span>
                <strong className="text-slate-800">{booking.entryTime ? formatDateTime(booking.entryTime) : 'Awaiting arrival'}</strong>
                {booking.entryGate && <div className="text-[10px] text-slate-500">{booking.entryGate}</div>}
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Exit scan</span>
                <strong className="text-slate-800">{booking.exitTime ? formatDateTime(booking.exitTime) : 'Not exited'}</strong>
                {booking.exitGate && <div className="text-[10px] text-slate-500">{booking.exitGate}</div>}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 no-print">
            {booking.latitude && booking.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-4 h-4 text-blue-600" aria-hidden="true" /> Navigate with Google Maps
              </a>
            )}
            {cancellable && (
              <button type="button" onClick={() => setShowCancel(true)} className="py-3 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors">
                Cancel booking
              </button>
            )}
          </div>
        </div>
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowCancel(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="cancel-title" className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 id="cancel-title" className="font-bold text-base text-slate-900">Cancel reservation?</h2>
            <p className="text-xs text-slate-500">
              Cancel booking <strong className="text-slate-700">{booking.bookingReference}</strong>? The bay is released.
              {booking.paymentStatus === 'COMPLETED' && ' Cancellations at least one hour before the start time are refunded in full.'}
            </p>
            <FormField label="Reason" as="select" value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCancel(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Keep booking</button>
              <button type="button" onClick={handleCancel} disabled={cancelling} className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50">
                {cancelling ? 'Cancelling…' : 'Confirm cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
