'use client';

import { useState, useTransition, useEffect } from 'react';
import { additionalPayment } from '@/app/_lib/actions';
import SubmitButton from '@/app/_components/SubmitButton';

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

  const formattedAmount = Number(paymentAmount || 0).toFixed(2);

  // ✅ Prefill reason automatically when modal opens
  useEffect(() => {
    const autoReason = `Added students — updated booking from ${oldStudents} to ${newStudents} students. Total changed from $${oldTotal.toFixed(
      2
    )} to $${newTotal.toFixed(2)}.`;
    setReason(autoReason);
  }, [oldStudents, newStudents, oldTotal, newTotal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const finalReason = reason.trim();

    startTransition(async () => {
      try {
        const session = await additionalPayment({
          bookingId,
          difference: paymentAmount,
          reason: finalReason,
          oldTotal,
          newTotal,
          newStudents,
          reason,
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200">
        {/* Header */}
        <h2 className="text-2xl font-semibold mb-2 text-center text-primary-800">
          Additional Payment
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          You’re submitting an additional payment for Booking{' '}
          <span className="font-semibold text-primary-700">#{bookingId}</span>
        </p>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-2 rounded-md text-center mb-4">
            {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          <div className="text-green-600 text-center font-medium py-6">
            ✅ Additional payment initiated successfully. Redirecting to
            Pay Station...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Additional Amount
              </label>
              <input
                type="text"
                value={`$${formattedAmount}`}
                readOnly
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-semibold border border-gray-300 focus:outline-none"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Reason for additional payment
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none resize-none"
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                {reason.length}/500
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => onClose?.(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium shadow-sm transition"
              >
                Cancel
              </button>

              <SubmitButton
                pendingLabel="Processing..."
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold shadow-md transition"
              >
                Pay Now
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
