'use client';

import { useState, useTransition, useEffect } from 'react';
import { additionalPayment } from '@/app/_lib/actions';
import SubmitButton from '@/app/_components/SubmitButton';
import { FormatCurrency } from '../_lib/utils';

export default function AdditionalPaymentForm({
  bookingId,
  paymentAmount,
  oldStudents,
  newStudents,
  oldTotal,
  newTotal,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const autoReason = `Added students — updated booking from ${oldStudents} to ${newStudents} students. Total changed from ${FormatCurrency(oldTotal)} to ${FormatCurrency(newTotal)}.`;
    setReason(autoReason);
  }, [oldStudents, newStudents, oldTotal, newTotal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    startTransition(async () => {
      try {
        const session = await additionalPayment({
          bookingId,
          difference: paymentAmount,
          reason: reason,
          oldTotal,
          newTotal,
          newStudents,
        });

        setIsSubmitted(true);

        if (session?.url) {
          setTimeout(() => onClose?.(true), 1000);
          window.location.href = session.url;
        } else {
          setErrorMessage('Stripe session failed. Please try again.');
        }
      } catch (err) {
        console.error('Additional payment request failed:', err);
        setErrorMessage(
          'There was a problem processing your additional payment. Please try again.'
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative border border-gray-200 overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-primary-800">
            Additional Payment
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Booking{' '}
            <span className="font-bold text-primary-700">#{bookingId}</span>
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center mb-4 border border-red-100">
            {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          <div className="text-green-600 text-center font-bold py-10 animate-pulse">
            ✅ Payment initiated. Redirecting...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Payment Amount Display */}
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
                Amount Due
              </label>
              <input
                type="text"
                value={FormatCurrency(paymentAmount)}
                readOnly
                className="w-full px-4 py-3 rounded-xl bg-gray-50 text-primary-700 font-bold border border-gray-100 focus:outline-none text-lg"
              />
            </div>

            {/* Read-Only Reason Breakdown */}
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-widest text-gray-400">
                Payment Breakdown
              </label>
              <textarea
                value={reason}
                readOnly
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-600 text-sm border border-gray-100 focus:outline-none resize-none italic leading-relaxed"
              />
              <p className="text-[10px] text-primary-300 mt-2 italic">
                * This reason is calculated based on your booking changes.
              </p>
            </div>

            {/* --- EVENLY SPACED ACTION BUTTONS --- */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => onClose?.(false)}
                className="flex-1 px-6 py-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-all text-sm order-2 sm:order-1"
              >
                Cancel
              </button>

              <div className="flex-1 order-1 sm:order-2">
                <SubmitButton
                  pendingLabel="Processing..."
                  disabled={isPending}
                  /* w-full here ensures the SubmitButton fills its flex container */
                  className="w-full px-6 py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-200 transition-all text-sm"
                >
                  Pay {FormatCurrency(paymentAmount)}
                </SubmitButton>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
