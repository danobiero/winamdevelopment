'use client';

import { useEffect, useState } from 'react';
import { sendProfileOtp, verifyProfileOtp } from './profile_actions';
import UpdateProfileForm from './UpdateProfileAdminForm';

export default function ProfileGate({ admin }) {
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // =====================================================
  // OTP COOLDOWN TIMER
  // =====================================================
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    try {
      setError('');
      setSending(true);

      await sendProfileOtp();

      // Start 60-second cooldown
      setCooldown(60);
    } catch (err) {
      setError(err.message || 'Failed to send code');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    try {
      setError('');
      setVerifying(true);

      await verifyProfileOtp(code);

      // Unlock profile
      setVerified(true);

      // Stop cooldown immediately after successful verification
      setCooldown(0);
    } catch (err) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setVerifying(false);
    }
  };

  if (verified) {
    return <UpdateProfileForm admin={admin} />;
  }

  return (
    <div className="mx-auto my-6 w-full max-w-md px-4 sm:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-slate-100 space-y-8">
        {/* HEADER SECTION */}
        <div className="space-y-3 text-center sm:text-left">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-2">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h3 className="text-2xl font-black text-[#000033] tracking-tight uppercase">
            Verify <span className="text-blue-600">Access</span>
          </h3>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            Security check required before modifying sensitive admin
            credentials.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* ACTION: SEND CODE */}
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sending || cooldown > 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending
              ? 'Processing...'
              : cooldown > 0
                ? `Request Again In ${cooldown}s`
                : 'Request Verification Code'}
          </button>

          {/* INPUT: OTP FIELD */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              Enter 6-Digit Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              className="w-full px-4 py-4 text-center text-2xl text-[16px] md:text-2xl tracking-[0.7em] font-black border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all placeholder:text-slate-200 placeholder:tracking-normal"
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl animate-shake">
              <p className="text-xs font-black text-rose-600 text-center uppercase tracking-wider">
                {error}
              </p>
            </div>
          )}

          {/* ACTION: VERIFY */}
          <button
            type="button"
            onClick={handleVerifyCode}
            disabled={verifying || code.length < 4}
            className="w-full py-4 bg-[#000033] hover:bg-black text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-xl transition-all active:scale-[0.97] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
          >
            {verifying ? 'Verifying...' : 'Unlock Profile Settings'}
          </button>
        </div>
      </div>

      {/* SECURE FOOTER */}
      <p className="mt-6 text-center text-xs font-bold text-slate-300 uppercase tracking-widest">
        Secure Admin Gateway • Encrypted Session
      </p>
    </div>
  );
}
