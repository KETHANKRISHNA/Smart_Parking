import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, QrCode, Smartphone, Building, ShieldCheck, CheckCircle2, AlertCircle, Lock, Timer } from 'lucide-react';
import api from '../services/api';
import { FormField } from '../components/common/FormField';

const METHODS = [
  { id: 'UPI', label: 'UPI', icon: Smartphone, tint: 'text-blue-600' },
  { id: 'CARD', label: 'Debit / Credit', icon: CreditCard, tint: 'text-purple-600' },
  { id: 'NET_BANKING', label: 'NetBanking', icon: Building, tint: 'text-emerald-600' },
];
const BANKS = ['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'];

const launchConfetti = () =>
  import('canvas-confetti').then((m) => m.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } }));

const secondsLeft = (iso) => (iso ? Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000)) : null);

/** Validates the chosen payment method and returns { error, instrument }. The instrument is all the server needs. */
const buildInstrument = (method, form) => {
  if (method === 'UPI') {
    if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(form.upiId.trim())) return { error: 'Enter a valid UPI ID, e.g. name@okaxis.' };
    return { instrument: form.upiId.trim() };
  }
  if (method === 'CARD') {
    const digits = form.cardNumber.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(digits)) return { error: 'Enter a valid card number.' };
    const [mm, yy] = form.cardExpiry.split('/').map((p) => parseInt(p, 10));
    const expiry = new Date(2000 + yy, mm, 0, 23, 59, 59);
    if (!mm || mm > 12 || Number.isNaN(yy) || expiry < new Date()) return { error: 'Enter a card expiry in the future (MM/YY).' };
    if (!/^\d{3,4}$/.test(form.cardCvv)) return { error: 'Enter the 3 or 4 digit CVV.' };
    // Only the last four digits leave the browser, and the CVV is never sent
    return { instrument: `card-${digits.slice(-4)}` };
  }
  return { instrument: form.bank };
};

export const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [method, setMethod] = useState('UPI');
  const [form, setForm] = useState({ upiId: '', cardNumber: '', cardExpiry: '', cardCvv: '', bank: BANKS[0] });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // completed payment
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(null);

  const loadBooking = useCallback(async () => {
    const res = await api.get(`/bookings/${bookingId}`);
    setBooking(res.data);
    return res.data;
  }, [bookingId]);

  useEffect(() => {
    if (!bookingId) {
      navigate('/bookings', { replace: true });
      return;
    }
    loadBooking()
      .then((b) => b.status === 'CONFIRMED' && navigate(`/booking/ticket/${b.id}`, { replace: true }))
      .catch((err) => setError(err.message || 'Could not load this booking'))
      .finally(() => setLoading(false));
  }, [bookingId, navigate, loadBooking]);

  // Countdown to the end of the 15 minute slot hold
  useEffect(() => {
    if (!booking?.holdExpiresAt || result) return undefined;
    const tick = () => setRemaining(secondsLeft(booking.holdExpiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [booking?.holdExpiresAt, result]);

  const setField = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const holdExpired = remaining === 0 || (booking && booking.status !== 'PENDING_PAYMENT' && !result);

  const handlePay = async (e) => {
    e.preventDefault();
    setError('');
    const { error: invalid, instrument } = buildInstrument(method, form);
    if (invalid) return setError(invalid);

    setProcessing(true);
    try {
      // 1. open a payment order for this booking, 2. the server charges it and decides the outcome
      const order = await api.post('/payments/create-order', { bookingId: Number(bookingId), paymentMethod: method });
      const paid = await api.post('/payments/confirm', { transactionId: order.data.transactionId, instrument });
      if (paid.data.paymentStatus === 'COMPLETED') {
        setResult(paid.data);
        launchConfetti();
      } else {
        setError(paid.data.failureReason || 'The payment was declined. Please try another method.');
      }
    } catch (err) {
      setError(err.message || 'Payment failed');
      loadBooking().catch(() => {});
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading payment">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" aria-hidden="true" />
        <h1 className="text-lg font-bold text-slate-900">Booking unavailable</h1>
        <p className="text-sm text-slate-600 mt-1">{error}</p>
        <Link to="/bookings" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">My bookings</Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-2xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Booking confirmed!</h1>
            <p className="text-xs text-slate-500 mt-1">Your QR parking ticket is ready for gate entry.</p>
          </div>
          <dl className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2 text-left max-w-sm mx-auto">
            <div className="flex justify-between text-slate-500"><dt>Booking</dt><dd className="font-bold text-slate-800 font-mono">{booking.bookingReference}</dd></div>
            <div className="flex justify-between text-slate-500"><dt>Transaction</dt><dd className="font-bold text-slate-800 font-mono text-[11px]">{result.transactionId}</dd></div>
            <div className="flex justify-between text-slate-500"><dt>Amount paid</dt><dd className="font-bold text-emerald-700">₹{result.amount}</dd></div>
            <div className="flex justify-between text-slate-500"><dt>Method</dt><dd className="font-bold text-slate-800">{result.paymentMethod?.replace('_', ' ')}</dd></div>
          </dl>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={`/booking/ticket/${booking.id}`} className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2">
              <QrCode className="w-4 h-4" aria-hidden="true" /> View QR ticket
            </Link>
            <Link to="/bookings" className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm">My bookings</Link>
          </div>
        </div>
      </div>
    );
  }

  const mm = remaining !== null ? String(Math.floor(remaining / 60)).padStart(2, '0') : '--';
  const ss = remaining !== null ? String(remaining % 60).padStart(2, '0') : '--';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded">Test mode: no real money moves</span>
            <h1 className="text-xl font-bold mt-2">Complete payment</h1>
            <p className="text-xs text-slate-400 mt-0.5">Booking <span className="font-mono text-white">{booking.bookingReference}</span></p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">Total</span>
            <div className="text-2xl font-black text-emerald-400">₹{booking.totalAmount}</div>
          </div>
        </div>

        {!holdExpired && remaining !== null && (
          <div className={`px-6 sm:px-8 py-2.5 text-xs font-semibold flex items-center gap-2 ${remaining < 120 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`} role="timer" aria-live="off">
            <Timer className="w-4 h-4" aria-hidden="true" />
            Your bay is held for {mm}:{ss}
          </div>
        )}

        {error && (
          <div role="alert" className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {holdExpired ? (
          <div className="p-8 text-center space-y-3">
            <p className="font-bold text-slate-900">This reservation is no longer payable.</p>
            <p className="text-xs text-slate-500">The 15 minute hold ended or the booking was cancelled, so the bay was released.</p>
            <Link to={`/parking/${booking.locationId}`} className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold">Book again</Link>
          </div>
        ) : (
          <form onSubmit={handlePay} className="p-6 sm:p-8 space-y-6">
            <fieldset>
              <legend className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Payment method</legend>
              <div className="grid grid-cols-3 gap-3">
                {METHODS.map(({ id, label, icon: Icon, tint }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={method === id}
                    onClick={() => { setMethod(id); setError(''); }}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${method === id ? 'border-blue-600 bg-blue-50/50 text-blue-800 ring-2 ring-blue-500/20 font-bold' : 'border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'}`}
                  >
                    <Icon className={`w-5 h-5 ${tint}`} aria-hidden="true" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {method === 'UPI' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <FormField label="UPI ID" name="upiId" value={form.upiId} onChange={setField} placeholder="name@okaxis" autoComplete="off" required />
                <p className="text-[11px] text-slate-500">Test tip: a UPI ID containing &quot;fail&quot; is declined.</p>
              </div>
            )}

            {method === 'CARD' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <FormField label="Card number" name="cardNumber" inputMode="numeric" value={form.cardNumber} onChange={setField} placeholder="4242 4242 4242 4242" autoComplete="cc-number" required />
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Expiry (MM/YY)" name="cardExpiry" value={form.cardExpiry} onChange={setField} placeholder="12/30" autoComplete="cc-exp" maxLength={5} required />
                  <FormField label="CVV" name="cardCvv" type="password" inputMode="numeric" value={form.cardCvv} onChange={setField} placeholder="123" autoComplete="cc-csc" maxLength={4} required />
                </div>
                <p className="text-[11px] text-slate-500">Test tip: use any card number; one ending in 0002 is declined. Only the last four digits are sent.</p>
              </div>
            )}

            {method === 'NET_BANKING' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <FormField label="Choose your bank" as="select" name="bank" value={form.bank} onChange={setField}>
                  {BANKS.map((b) => <option key={b}>{b}</option>)}
                </FormField>
              </div>
            )}

            <button
              type="submit"
              disabled={processing}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Processing payment" />
              ) : (
                <>
                  <Lock className="w-4 h-4" aria-hidden="true" />
                  Pay ₹{booking.totalAmount}
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              <span>Sandbox gateway: the server confirms every payment</span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
