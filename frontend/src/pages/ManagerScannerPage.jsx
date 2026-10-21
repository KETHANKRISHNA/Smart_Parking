import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanLine, Camera, CheckCircle2, XCircle, AlertTriangle, LogOut, LogIn, QrCode, RotateCcw } from 'lucide-react';
import api from '../services/api';
import { FormField } from '../components/common/FormField';
import { formatTime } from '../utils/datetime';
import { usePageTitle } from '../hooks/usePageTitle';

const GATES = ['Main Entrance', 'North Gate', 'South Gate', 'VIP / EV Lane'];
const READER_ID = 'qr-reader-container';

export const ManagerScannerPage = () => {
  usePageTitle('Gate scanner');
  const [tokenInput, setTokenInput] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [gateName, setGateName] = useState(GATES[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const tokenRef = useRef(null);

  const verify = useCallback(async (raw) => {
    const token = (raw || '').trim();
    if (!token) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await api.post('/manager/verify-ticket', { qrToken: token });
      setVerifiedToken(token);
      setResult(res.data);
    } catch (err) {
      setVerifiedToken('');
      setResult({ valid: false, message: err.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Camera scanner. Cleanup (clear) runs when the camera is switched off or the page unmounts.
  useEffect(() => {
    if (!cameraActive) return undefined;
    const scanner = new Html5QrcodeScanner(READER_ID, { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    scanner.render(
      (decodedText) => {
        setTokenInput(decodedText);
        verify(decodedText);
        setCameraActive(false);
      },
      () => {} // per-frame "no QR found" noise
    );
    return () => {
      scanner.clear().catch(() => {});
    };
  }, [cameraActive, verify]);

  const runGateAction = async (kind) => {
    if (!verifiedToken) return;
    setLoading(true);
    try {
      const res = await api.post(`/manager/gate-${kind}`, { qrToken: verifiedToken, gateName });
      setActionMessage({ type: 'success', text: res.data.message });
      setResult(res.data);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Ready for the next vehicle: clear everything and put the cursor back in the token box
  const scanNext = () => {
    setTokenInput('');
    setVerifiedToken('');
    setResult(null);
    setActionMessage(null);
    tokenRef.current?.focus();
  };

  useEffect(() => {
    tokenRef.current?.focus();
  }, []);

  const inside = Boolean(result?.entryTime) && !result?.exitTime;
  const canEnter = Boolean(result?.valid) && !result?.entryTime;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Gate entry &amp; exit scanner</h1>
        <p className="text-xs text-slate-500 mt-0.5">Scan a driver&apos;s QR pass to check the ticket, then open the gate for entry or exit. You can only process tickets for your own facility.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6" aria-labelledby="scan-heading">
          <div className="flex items-center justify-between">
            <h2 id="scan-heading" className="text-base font-bold text-slate-900">Scan or enter a ticket</h2>
            <button
              type="button"
              onClick={() => setCameraActive((on) => !on)}
              aria-pressed={cameraActive}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${cameraActive ? 'bg-rose-100 text-rose-700' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
            >
              <Camera className="w-3.5 h-3.5" aria-hidden="true" />
              {cameraActive ? 'Turn off camera' : 'Use device camera'}
            </button>
          </div>

          {cameraActive && (
            <div className="rounded-2xl overflow-hidden border-2 border-purple-300 p-2 bg-slate-900">
              <div id={READER_ID} className="w-full" />
            </div>
          )}

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              verify(tokenInput);
            }}
          >
            <div className="flex gap-2 items-end">
              <FormField
                className="flex-1"
                label="Ticket token"
                icon={QrCode}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.trim().toUpperCase())}
                placeholder="SP-A1B2C3D4E5F6A7B8"
                ref={tokenRef}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" disabled={loading || !tokenInput.trim()} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 disabled:opacity-50 transition-all h-[42px]">
                {loading ? 'Checking…' : 'Verify'}
              </button>
            </div>
            <FormField label="Gate / booth" as="select" value={gateName} onChange={(e) => setGateName(e.target.value)}>
              {GATES.map((g) => <option key={g}>{g}</option>)}
            </FormField>
          </form>

          {actionMessage && (
            <div role={actionMessage.type === 'error' ? 'alert' : 'status'} className={`p-4 rounded-2xl text-xs flex items-center gap-2.5 ${actionMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
              {actionMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" /> : <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />}
              <span className="font-semibold">{actionMessage.text}</span>
            </div>
          )}
        </section>

        <section className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6 self-start" aria-labelledby="result-heading" aria-live="polite">
          <div>
            <h2 id="result-heading" className="text-base font-bold text-slate-900">Ticket check</h2>
            <p className="text-xs text-slate-500 mt-0.5">Gate clearance status</p>
          </div>

          {!result ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <ScanLine className="w-12 h-12 mx-auto text-slate-300" aria-hidden="true" />
              <p className="text-xs font-semibold">Waiting for a scan…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border flex items-center gap-3 ${result.valid ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' : 'bg-rose-50/80 border-rose-200 text-rose-900'}`}>
                {result.valid ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" aria-hidden="true" /> : <XCircle className="w-6 h-6 text-rose-600 shrink-0" aria-hidden="true" />}
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider">{result.valid ? 'Ticket OK' : 'Do not admit'}</h3>
                  <p className="text-xs mt-0.5">{result.message}</p>
                </div>
              </div>

              {result.bookingReference && (
                <dl className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2.5">
                  <div className="flex justify-between"><dt className="text-slate-500">Booking</dt><dd className="font-mono font-bold text-slate-900">{result.bookingReference}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Driver</dt><dd className="font-bold text-slate-900">{result.userName}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Vehicle</dt><dd className="font-mono font-bold uppercase text-slate-900">{result.vehicleNumber}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Bay</dt><dd className="font-mono font-bold text-purple-700">{result.slotNumber}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Booked window</dt><dd className="font-bold">{formatTime(result.bookingStartTime)} – {formatTime(result.bookingEndTime)}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Entered</dt><dd className="font-bold">{result.entryTime ? formatTime(result.entryTime) : '—'}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Exited</dt><dd className="font-bold">{result.exitTime ? formatTime(result.exitTime) : '—'}</dd></div>
                  {result.overtimeMinutes > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                      <strong>Overstay:</strong> {result.overtimeMinutes} min over. Collect ₹{result.additionalFee} at the gate.
                    </div>
                  )}
                </dl>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => runGateAction('entry')} disabled={loading || !canEnter} className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5">
                  <LogIn className="w-4 h-4" aria-hidden="true" /> Admit vehicle
                </button>
                <button type="button" onClick={() => runGateAction('exit')} disabled={loading || !inside} className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5">
                  <LogOut className="w-4 h-4" aria-hidden="true" /> Release vehicle
                </button>
              </div>
              <button type="button" onClick={scanNext} className="w-full py-2.5 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Scan next vehicle
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
