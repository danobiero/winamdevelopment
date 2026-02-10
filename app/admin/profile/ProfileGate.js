'use client';

import { useState } from 'react';
import { sendProfileOtp, verifyProfileOtp } from './profile_actions';
import UpdateProfileForm from './UpdateProfileAdminForm';

export default function ProfileGate({ admin }) {
  const [verified, setVerified] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSendCode = async () => {
    try {
      setError('');
      setSending(true);
      await sendProfileOtp();
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
      setVerified(true);
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
    /* UPDATED: Added responsive margin and full width on small screens */
    <div className="mx-auto my-4 w-[95%] max-w-md bg-white p-6 md:p-8 rounded-xl shadow-lg border border-primary-100 space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-900">
          Verify Profile Access
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          A verification code will be sent to your email. This ensures your
          account remains secure before editing sensitive data.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* UPDATED: Full width button on mobile for easier tapping */}
        <button
          type="button"
          onClick={handleSendCode}
          disabled={sending}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors shadow-sm"
        >
          {sending ? 'Sending…' : 'Get Verification Code'}
        </button>

        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code" /* Logic for mobile: suggests the code from SMS/Email */
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            /* UPDATED: Increased padding and font size for better mobile interaction */
            className="w-full px-4 py-3 text-center text-xl tracking-[0.5em] font-mono border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600 text-center font-medium">
              {error}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleVerifyCode}
          disabled={verifying || code.length < 4}
          /* UPDATED: High contrast button with ample height for thumbs */
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:bg-gray-400 transition-all shadow-md"
        >
          {verifying ? 'Verifying…' : 'Verify & Continue'}
        </button>
      </div>
    </div>
  );
}
