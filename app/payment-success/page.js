'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

function PaymentSuccessContent() {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your contribution...');
  const [paymentType, setPaymentType] = useState(null); // 'FEE' or 'INVESTMENT'

  const searchParams = useSearchParams();
  const hasRecorded = useRef(false);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId || hasRecorded.current) return;

    const confirmPayment = async () => {
      hasRecorded.current = true;
      try {
        const res = await fetch(`/api/record-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          // Capture the type from the API response metadata
          const type = data.payment?.type;
          setPaymentType(type);

          // Customize message based on type
          if (type === 'FEE') {
            setMessage(
              'Application fee received! Your membership roadmap has been updated.'
            );
          } else {
            setMessage(
              'Contribution received! Your portfolio has been updated.'
            );
          }
        } else {
          setStatus('error');
          setMessage(data.error || 'We could not verify this payment.');
        }
      } catch (err) {
        console.error('Payment success error:', err);
        setStatus('error');
        setMessage(
          'Connection error. Please check your dashboard in a few minutes.'
        );
      }
    };

    confirmPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-slate-100">
        <div className="mb-8 flex justify-center">
          {status === 'loading' && (
            <div className="h-20 w-20 flex items-center justify-center">
              <ArrowPathIcon className="h-12 w-12 text-primary-600 animate-spin" />
            </div>
          )}

          {status === 'success' && (
            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckIcon className="h-12 w-12 text-emerald-600 stroke-[3]" />
            </div>
          )}

          {status === 'error' && (
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <XMarkIcon className="h-12 w-12 text-red-600 stroke-[3]" />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-3">
          {status === 'loading'
            ? 'Authenticating...'
            : status === 'success'
              ? 'Confirmed!'
              : 'Action Required'}
        </h1>

        <p className="text-slate-600 text-base mb-10 leading-relaxed px-4">
          {message}
        </p>

        <div className="flex flex-col gap-4">
          {status === 'success' ? (
            <Link
              href="/membership"
              className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95"
            >
              {paymentType === 'FEE' ? 'Continue Onboarding' : 'View Portfolio'}
            </Link>
          ) : (
            <Link
              href="/membership"
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95"
            >
              Back to Roadmap
            </Link>
          )}

          <Link
            href="/"
            className="text-sm font-bold text-slate-400 hover:text-primary-600 transition-colors uppercase tracking-widest"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 font-medium">
          Loading WINAM secure portal...
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
