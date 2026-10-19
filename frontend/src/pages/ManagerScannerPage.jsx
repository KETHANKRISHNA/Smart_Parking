import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  ScanLine,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  LogOut,
  LogIn,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Clock
} from 'lucide-react';

export const ManagerScannerPage = () => {
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [gateName, setGateName] = useState('Gate 1 (Main Entrance)');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef(null);

  // Today's demo tokens for quick 1-click test scanning
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/manager/today-bookings');
        if (res.success && res.data) {
          setRecentBookings(res.data);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    fetchRecent();
  }, []);

  const handleVerify = async (tokenToVerify) => {
    const token = tokenToVerify || qrTokenInput.trim();
    if (!token) return;

    setLoading(true);
    setActionMessage(null);
    try {
      const res = await api.post('/manager/verify-ticket', { qrToken: token });
      if (res.success && res.data) {
        setVerificationResult(res.data);
      }
    } catch (err) {
      setVerificationResult({
        valid: false,
        message: err.message || 'Verification failed: invalid token',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEntry = async () => {
    if (!verificationResult?.bookingReference) return;
    setLoading(true);
    try {
      const res = await api.post('/manager/gate-entry', {
        qrToken: qrTokenInput.trim(),
        gateName: gateName,
      });
      if (res.success && res.data) {
        setActionMessage({
          type: 'success',
          text: 'Gate Entry Recorded! Barrier raised for vehicle: ' + res.data.vehicleNumber,
        });
        setVerificationResult(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async () => {
    if (!verificationResult?.bookingReference) return;
    setLoading(true);
    try {
      const res = await api.post('/manager/gate-exit', {
        qrToken: qrTokenInput.trim(),
        gateName: gateName,
      });
      if (res.success && res.data) {
        const overtimeText = res.data.overtimeMinutes > 0
          ? ` (Overtime: ${res.data.overtimeMinutes} mins, Fee: ₹${res.data.additionalFee})`
          : '';
        setActionMessage({
          type: 'success',
          text: 'Gate Exit Approved! Parking session completed.' + overtimeText,
        });
        setVerificationResult(res.data);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Toggle Camera QR Scanner
  useEffect(() => {
    if (cameraActive) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          setQrTokenInput(decodedText);
          handleVerify(decodedText);
          scanner.clear();
          setCameraActive(false);
        },
        (error) => {
          // ignore stream noise
        }
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(console.warn);
      };
    }
  }, [cameraActive]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gate Entry & Exit QR Scanner</h1>
        <p className="text-xs text-slate-500 mt-0.5">Scan driver passes, validate timestamps, prevent duplicate check-ins, and control gate barriers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Scanner & Verification Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">QR Code Scanner Interface</h2>
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                cameraActive ? 'bg-rose-100 text-rose-700' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              {cameraActive ? 'Turn Off Camera' : 'Use Device Camera'}
            </button>
          </div>

          {/* Camera Viewport */}
          {cameraActive && (
            <div className="rounded-2xl overflow-hidden border-2 border-purple-300 p-2 bg-slate-900">
              <div id="qr-reader-container" className="w-full" />
            </div>
          )}

          {/* Manual Input or Scanned Value */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ticket Verification Token
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={qrTokenInput}
                    onChange={(e) => setQrTokenInput(e.target.value.toUpperCase())}
                    placeholder="e.g. SP-A1B2C3D4E5F6..."
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={loading || !qrTokenInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Checking...' : 'Verify'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operating Gate Booth
              </label>
              <select
                value={gateName}
                onChange={(e) => setGateName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
              >
                <option value="Gate 1 (North Entrance)">Gate 1 (North Main Entrance)</option>
                <option value="Gate 2 (South Exit)">Gate 2 (South Main Exit)</option>
                <option value="Gate 3 (VIP / EV Lanes)">Gate 3 (VIP & EV Priority Lane)</option>
              </select>
            </div>
          </div>

          {/* Quick Demo QR Tokens */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Test: Active Passes for Today
            </span>
            <div className="flex flex-wrap gap-2">
              {recentBookings.slice(0, 3).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setQrTokenInput(b.qrToken);
                    handleVerify(b.qrToken);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-[11px] font-mono font-semibold text-slate-700 border border-slate-200 transition-colors"
                >
                  {b.bookingReference} ({b.slotNumber})
                </button>
              ))}
            </div>
          </div>

          {/* Action notification alert */}
          {actionMessage && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${
                actionMessage.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{actionMessage.text}</span>
            </div>
          )}
        </div>

        {/* Right Verification Result & Gate Trigger (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 self-start">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pass Verification Telemetry</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time gate clearance status</p>
          </div>

          {!verificationResult ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <ScanLine className="w-12 h-12 mx-auto text-slate-300 animate-pulse-subtle" />
              <p className="text-xs font-semibold">Awaiting QR scan...</p>
              <p className="text-[11px] text-slate-400">Scan or select a token to verify vehicle rights</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Status Header */}
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  verificationResult.valid
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}
              >
                {verificationResult.valid ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider">
                    {verificationResult.valid ? 'VALID PASS VERIFIED' : 'INVALID TICKET'}
                  </h4>
                  <p className="text-xs mt-0.5">{verificationResult.message}</p>
                </div>
              </div>

              {/* Vehicle & Session details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Ref:</span>
                  <strong className="font-mono text-slate-900">{verificationResult.bookingReference || 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Name:</span>
                  <strong className="text-slate-900">{verificationResult.userName || 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle Plate:</span>
                  <strong className="font-mono uppercase text-slate-900">{verificationResult.vehicleNumber || 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Bay:</span>
                  <strong className="font-mono text-purple-700 font-bold">{verificationResult.slotNumber || 'N/A'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry Recorded:</span>
                  <strong>{verificationResult.entryTime ? new Date(verificationResult.entryTime).toLocaleTimeString() : 'None'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Exit Recorded:</span>
                  <strong>{verificationResult.exitTime ? new Date(verificationResult.exitTime).toLocaleTimeString() : 'None'}</strong>
                </div>

                {verificationResult.overtimeMinutes > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    <strong>Overstay Alert:</strong> {verificationResult.overtimeMinutes} mins overdue. Penalty fee: ₹{verificationResult.additionalFee}
                  </div>
                )}
              </div>

              {/* Gate Trigger Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleEntry}
                  disabled={loading || !verificationResult.valid || verificationResult.entryTime}
                  className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Process Entry
                </button>

                <button
                  type="button"
                  onClick={handleExit}
                  disabled={loading || !verificationResult.valid || !verificationResult.entryTime || verificationResult.exitTime}
                  className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Process Exit
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
