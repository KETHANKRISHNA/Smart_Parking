import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';

export const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');
  const bookingRef = searchParams.get('ref');

  const [booking, setBooking] = useState(null);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form mock inputs
  const [upiId, setUpiId] = useState('driver@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');

  useEffect(() => {
    if (!bookingId) {
      navigate('/bookings');
      return;
    }

    const initPayment = async () => {
      try {
        const bRes = await api.get(`/bookings/${bookingId}`);
        if (bRes.success) {
          setBooking(bRes.data);

          // Create payment order
          const orderRes = await api.post('/payments/create-order', {
            bookingId: Number(bookingId),
            paymentMethod: selectedMethod,
          });
          if (orderRes.success) {
            setPaymentOrder(orderRes.data);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize payment');
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, [bookingId, navigate, selectedMethod]);

  const handleSimulatePayment = async (simulateSuccess = true) => {
    if (!paymentOrder?.transactionId) return;

    setProcessing(true);
    setError('');

    // Small delay to simulate payment gateway processing
    setTimeout(async () => {
      try {
        const res = await api.post('/payments/confirm', {
          transactionId: paymentOrder.transactionId,
          simulateSuccess: simulateSuccess,
        });

        if (res.success && res.data.paymentStatus === 'COMPLETED') {
          setIsSuccess(true);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } else {
          setError(res.data?.failureReason || 'Payment declined by bank');
        }
      } catch (err) {
        setError(err.message || 'Payment simulation failed');
      } finally {
        setProcessing(false);
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-6">
      
      {/* Payment Success State */}
      {isSuccess ? (
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Payment Completed (Demo)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Slot Reserved Successfully!
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your digital QR parking ticket pass is active and ready for gate entry.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2 text-left max-w-sm mx-auto">
            <div className="flex justify-between text-slate-500">
              <span>Booking Reference:</span>
              <strong className="text-slate-800 font-mono">{bookingRef || booking?.bookingReference}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Transaction ID:</span>
              <strong className="text-slate-800 font-mono text-[11px]">{paymentOrder?.transactionId}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Amount Paid:</span>
              <strong className="text-emerald-700 font-bold">₹{booking?.totalAmount}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Payment Mode:</span>
              <strong className="text-slate-800">{selectedMethod}</strong>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={`/booking/ticket/${bookingId}`}
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              <QrCode className="w-4 h-4" />
              View Digital QR Ticket Pass
            </Link>
            <Link
              to="/bookings"
              className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
            >
              My Bookings
            </Link>
          </div>
        </div>
      ) : (
        /* Payment Initiation Card */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded">
                  DEMO PAYMENT GATEWAY
                </span>
                <span className="text-[10px] text-slate-400 font-mono">100% Cashless</span>
              </div>
              <h2 className="text-xl font-bold mt-2">Complete Payment</h2>
              <p className="text-xs text-slate-400 mt-0.5">Booking Ref: <span className="font-mono text-white">{bookingRef || booking?.bookingReference}</span></p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400">Total Amount</span>
              <div className="text-2xl font-black text-emerald-400">₹{booking?.totalAmount}</div>
            </div>
          </div>

          {error && (
            <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-6">
            {/* Method Tabs */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('UPI')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'UPI'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-800 ring-2 ring-blue-500/20 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CARD')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'CARD'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-800 ring-2 ring-blue-500/20 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span className="text-xs">Debit / Credit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('NET_BANKING')}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    selectedMethod === 'NET_BANKING'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-800 ring-2 ring-blue-500/20 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <Building className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs">NetBanking</span>
                </button>
              </div>
            </div>

            {/* Method Details */}
            {selectedMethod === 'UPI' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">UPI Virtual ID</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="name@okaxis or user@upi"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-blue-600"
                />
                <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, or BHIM UPI supported.</p>
              </div>
            )}

            {selectedMethod === 'CARD' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'NET_BANKING' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <p className="font-semibold text-slate-700">Supported Popular Banks:</p>
                <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">HDFC Bank</div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">State Bank of India</div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">ICICI Bank</div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">Axis Bank</div>
                </div>
              </div>
            )}

            {/* Simulated Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleSimulatePayment(true)}
                disabled={processing}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] disabled:opacity-50"
              >
                {processing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Pay ₹{booking?.totalAmount} (Simulate Success)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSimulatePayment(false)}
                disabled={processing}
                className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors"
              >
                Simulate Payment Decline (Test Error Handling)
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>256-Bit SSL Encrypted Sandbox Gateway Simulation</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
