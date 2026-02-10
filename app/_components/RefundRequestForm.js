'use client';

import { useState, useTransition, useEffect } from 'react';
import { requestRefund } from '@/app/_lib/actions';
import SubmitButton from '@/app/_components/SubmitButton';
import { FormatCurrency } from '../_lib/utils';

export default function RefundRequestForm({
  bookingId,
  refundAmount,
  numStudents,
  oldTotal,
  newTotal,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  // 1. Format the main refund amount for the UI display box
  const displayRefund = FormatCurrency(refundAmount);

  // 2. Auto-generate reason logic
  useEffect(() => {
    // Generate formatted strings for the reason text
    const displayOldTotal = FormatCurrency(oldTotal);
    const displayNewTotal = FormatCurrency(newTotal);
    const isFullCancellation = newTotal === 0;

    const autoReason = isFullCancellation
      ? `Full cancellation of booking #${bookingId}. Total refund: ${displayOldTotal}.`
      : `Reduced student count to ${numStudents} — updated booking total from ${displayOldTotal} to ${displayNewTotal}.`;

    setReason(autoReason);
    // Only depend on the raw numbers/IDs to avoid infinite loops or reference errors
  }, [oldTotal, newTotal, numStudents, bookingId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    startTransition(async () => {
      try {
        await requestRefund({
          bookingId,
          refundAmount,
          reason,
          numStudents,
          oldTotal,
          newTotal,
        });

        setIsSubmitted(true);
        setTimeout(() => onClose?.(true), 2000);
      } catch (err) {
        console.error('Refund request failed:', err);
        setErrorMessage(
          err.message || 'There was a problem submitting your refund request.'
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3 sm:px-4">
      <div
        className="
          bg-white text-gray-800 rounded-2xl shadow-2xl
          w-full max-w-md
          max-h-[90vh] overflow-y-auto
          p-5 sm:p-8
          border border-gray-100
          animate-in fade-in zoom-in duration-300
        "
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-blue-950 mb-1">
            Refund Request
          </h2>
          <p className="text-xs sm:text-sm text-primary-400 font-medium">
            Booking Reference{' '}
            <span className="text-primary-600">#{bookingId}</span>
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-center mb-4 text-xs font-bold uppercase tracking-wide">
            {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="h-8 w-8"
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
            <p className="text-green-700 font-bold text-lg">
              Request Submitted
            </p>
            <p className="text-gray-500 text-sm">
              We'll review this within 2–3 business days.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Refund Amount Display - Uses displayRefund helper */}
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-primary-400 mb-1">
                Estimated Refund
              </label>
              <span className="text-2xl font-black text-logo-100">
                {displayRefund}
              </span>
            </div>

            {/* Reason Display */}
            <div>
              <label className="block text-xs font-bold text-primary-600 mb-2 uppercase tracking-wide">
                Reason for refund
              </label>
              <textarea
                value={reason}
                readOnly
                rows={3}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-gray-50 text-gray-600
                  border border-gray-200
                  resize-none cursor-default
                  text-sm leading-relaxed
                "
              />
              <p className="text-[10px] text-primary-300 mt-2 italic">
                * This reason is calculated based on your booking changes.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => onClose?.(false)}
                className="
                  order-2 sm:order-1 flex-1
                  px-6 py-3 rounded-xl
                  bg-gray-100 hover:bg-gray-200
                  text-gray-600 font-bold
                  transition-all text-sm
                "
              >
                Cancel
              </button>

              <SubmitButton
                pendingLabel="Processing..."
                disabled={isPending}
                className="
                  order-1 sm:order-2 flex-[1.5]
                  px-6 py-3 rounded-xl
                  bg-red-600 hover:bg-red-700
                  text-white font-black
                  shadow-lg shadow-red-200 transition-all text-sm
                  active:scale-95
                "
              >
                Confirm Refund
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
