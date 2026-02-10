'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('Recording your payment...');
  const searchParams = useSearchParams();
  const hasRecorded = useRef(false); // Prevents double-firing in Strict Mode

  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    if (!sessionId || hasRecorded.current) return;

    const confirmPayment = async () => {
      hasRecorded.current = true;
      try {
        const res = await fetch(`/api/record-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage(
            `Payment recorded successfully for booking #${bookingId || 'ID'}`
          );
        } else {
          setStatus('error');
          setMessage(data.error || 'Payment recording failed');
        }
      } catch (err) {
        console.error('Payment success error:', err);
        setStatus('error');
        setMessage('Failed to connect to the server.');
      }
    };

    confirmPayment();
  }, [sessionId, bookingId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in duration-500">
        {/* Animated Icon Container */}
        <div className="mb-6 flex justify-center">
          {status === 'loading' && (
            <div className="h-16 w-16 border-4 border-logo-100/20 border-t-logo-100 rounded-full animate-spin" />
          )}

          {status === 'success' && (
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}

          {status === 'error' && (
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Text Content */}
        <h1 className="text-2xl font-black text-blue-950 mb-2">
          {status === 'loading'
            ? 'Verifying...'
            : status === 'success'
              ? 'Thank You!'
              : 'Payment Issue'}
        </h1>

        <p className="text-primary-600 text-sm md:text-base mb-8 leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/account/reservations"
            className="w-full bg-logo-100 text-white font-bold py-3 rounded-xl hover:bg-logo-100/90 transition-all shadow-md active:scale-95"
          >
            View My Lessons
          </Link>

          <Link
            href="/"
            className="text-sm font-semibold text-primary-400 hover:text-primary-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
