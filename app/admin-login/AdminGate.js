'use client';

import { useState, useEffect } from 'react';
import { sendAdminOtp, verifyAdminOtp } from './admin-actions';

export default function AdminGate({ onVerified }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState({ sending: false, verifying: false });

  // Cooldown State
  const [cooldown, setCooldown] = useState(0);

  // Timer Effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    if (cooldown > 0) return;

    try {
      setError('');
      setLoading((prev) => ({ ...prev, sending: true }));
      await sendAdminOtp();
      setCooldown(60); // Set 60 second cooldown on success
    } catch (err) {
      setError(err.message || 'Verification system offline');
    } finally {
      setLoading((prev) => ({ ...prev, sending: false }));
    }
  };

  const handleVerifyCode = async () => {
    try {
      setError('');
      setLoading((prev) => ({ ...prev, verifying: true }));
      await verifyAdminOtp(code);
      onVerified();
    } catch (err) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading((prev) => ({ ...prev, verifying: false }));
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="text-center space-y-1 mb-4">
        <p className="text-xs font-black text-blue-600 uppercase tracking-widest">
          Security Protocol Required
        </p>
      </div>

      {/* REQUEST BUTTON WITH COOLDOWN */}
      <button
        type="button"
        onClick={handleSendCode}
        disabled={loading.sending || cooldown > 0}
        className={`w-full py-3 text-xs font-black uppercase tracking-widest rounded-lg transition-all border
          ${
            cooldown > 0
              ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
              : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'
          }`}
      >
        {loading.sending
          ? 'Requesting...'
          : cooldown > 0
            ? `Resend in ${cooldown}s`
            : 'Request Access Code'}
      </button>

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="••••••"
          className="w-full px-4 py-4 text-center text-2xl tracking-[0.5em] font-black border-2 border-slate-100 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-200"
        />
      </div>

      {error && (
        <div className="p-2 bg-rose-50 rounded-lg border border-rose-100 animate-shake">
          <p className="text-xs font-black text-rose-500 text-center uppercase">
            {error}
          </p>
        </div>
      )}

      {/* VERIFY BUTTON */}
      <button
        type="button"
        onClick={handleVerifyCode}
        disabled={loading.verifying || code.length < 4}
        className="w-full py-4 bg-[#000033] text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.95] disabled:bg-slate-200 disabled:shadow-none"
      >
        {loading.verifying ? 'Verifying...' : 'Unlock Admin Portal'}
      </button>

      <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
        Step 1: Verify Identity • Step 2: Google Auth
      </p>
    </div>
  );
}
