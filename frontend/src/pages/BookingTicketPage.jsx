import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  QrCode,
  Download,
  MapPin,
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Share2,
  Navigation,
  FileText,
  Printer
} from 'lucide-react';

export const BookingTicketPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Change of plans');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}`);
        if (res.success) {
          setBooking(res.data);
        }
      } catch (err) {
        setError(err.message || 'Could not load ticket');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.post(`/bookings/${id}/cancel`, { reason: cancelReason });
      if (res.success) {
        setBooking(res.data);
        setShowCancelModal(false);
      }
    } catch (err) {
      alert('Cancellation failed: ' + err.message);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h2 className="text-xl font-bold text-slate-800">Ticket Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <Link to="/bookings" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Return to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12 space-y-6">
      
      {/* Top action row */}
      <div className="flex items-center justify-between no-print">
        <Link
          to="/bookings"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          My Bookings
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 border border-slate-200"
            title="Print Pass"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Pass</span>
          </button>
          <button
            onClick={handleDownloadQr}
            className="p-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 border border-blue-200"
            title="Download QR"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save QR</span>
          </button>
        </div>
      </div>

      {/* Main Digital Ticket Pass Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden print:border-none print:shadow-none">
        {/* Pass Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded">
              DIGITAL PARKING PASS
            </span>
            <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
              {booking.locationName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
              <span>{booking.locationAddress}, {booking.locationCity}</span>
            </p>
          </div>

          <div className="relative z-10 text-right">
            <StatusBadge status={booking.status} />
            <div className="mt-2 text-xs font-mono font-bold text-slate-300">
              {booking.bookingReference}
            </div>
          </div>
        </div>

        {/* QR Code Presentation Section */}
        <div className="p-6 sm:p-8 text-center bg-slate-50/50 border-b border-slate-100 flex flex-col items-center">
          <div className="bg-white p-4 rounded-3xl border-2 border-slate-200/80 shadow-md inline-block">
            {booking.qrCodeBase64 ? (
              <img
                src={booking.qrCodeBase64}
                alt="Parking Verification QR Code"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain rounded-xl"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                QR Unavailable
              </div>
            )}
          </div>

          <p className="text-xs font-semibold text-slate-700 mt-4 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-blue-600" />
            Scan this QR code at Entry & Exit gate readers
          </p>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
            Token: <span className="text-slate-600 font-semibold">{booking.qrToken}</span>
          </div>
        </div>

        {/* Ticket Details Grid */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">PARKING BAY</span>
              <strong className="text-xl font-black text-blue-700 font-mono">{booking.slotNumber}</strong>
              <div className="text-[10px] text-slate-500 capitalize">{booking.floorLevel}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">VEHICLE PLATE</span>
              <strong className="text-sm font-bold text-slate-800 uppercase font-mono">{booking.vehicleNumber}</strong>
              <div className="text-[10px] text-slate-500 capitalize">{booking.vehicleType}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">START TIME</span>
              <strong className="text-xs font-bold text-slate-800">
                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
              <div className="text-[10px] text-slate-500">{new Date(booking.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">END TIME</span>
              <strong className="text-xs font-bold text-slate-800">
                {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </strong>
              <div className="text-[10px] text-slate-500">{booking.totalHours} hrs paid</div>
            </div>
          </div>

          {/* Gate Entry / Exit Session Timestamps */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs">
            <h4 className="font-bold text-blue-900 text-xs uppercase tracking-wider">Gate Activity Log</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 block text-[11px]">Gate Entry Scan:</span>
                <strong className="text-slate-800">
                  {booking.entryTime ? new Date(booking.entryTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Pending Arrival'}
                </strong>
                {booking.entryGate && <div className="text-[10px] text-slate-400">{booking.entryGate}</div>}
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Gate Exit Scan:</span>
                <strong className="text-slate-800">
                  {booking.exitTime ? new Date(booking.exitTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Not Exited'}
                </strong>
                {booking.exitGate && <div className="text-[10px] text-slate-400">{booking.exitGate}</div>}
              </div>
            </div>
          </div>

          {/* Navigation & Directions link */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 no-print">
            {booking.latitude && booking.longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                Navigate with Google Maps
              </a>
            )}

            {booking.status === 'CONFIRMED' && !booking.entryTime && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="py-3 px-5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-base text-slate-900">Cancel Reservation?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel booking <strong className="text-slate-700">{booking.bookingReference}</strong>? Slot will be released and payment refunded.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
              >
                <option value="Change of plans">Change of plans</option>
                <option value="Found alternative parking">Found alternative parking</option>
                <option value="Booking date/time mistake">Booking date/time mistake</option>
                <option value="Vehicle issue">Vehicle issue</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
