'use client';

import { useState, useTransition, useEffect } from 'react';
import { requestRefundAdmin } from '@/app/_lib/actions';
import SubmitButton from '@/app/_components/SubmitButton';
import { FormatCurrency } from '../_lib/utils';

export default function RefundRequestFormAdmin({
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

  const formattedAmount = FormatCurrency(refundAmount || 0);
  const formattedOldTotal = FormatCurrency(oldTotal)
  const formattedNewTotal = FormatCurrency(newTotal)

  // ✅ Prefill reason automatically when modal opens
  useEffect(() => {
    const autoReason = `Reduced students — updated booking total from ${formattedOldTotal} to ${formattedNewTotal}.`;
    setReason(autoReason);
  }, [oldTotal, newTotal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const finalReason = reason.trim();

    startTransition(async () => {
      try {
        await requestRefundAdmin({
          bookingId,
          refundAmount,
          reason: finalReason,
          numStudents,
          oldTotal,
          newTotal,
        });

        setIsSubmitted(true);
        setTimeout(() => onClose?.(true), 1500);
      } catch (err) {
        console.error('Refund request failed:', err);
        setErrorMessage(
          'There was a problem submitting your refund request. Please try again.'
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200">
        {/* Header */}
        <h2 className="text-2xl font-semibold mb-2 text-center text-primary-800">
          Admin Refund Request
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          You’re requesting a refund for Booking{' '}
          <span className="font-semibold text-primary-700">#{bookingId}</span>
        </p>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-2 rounded-md text-center mb-4">
            {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          <div className="text-green-600 text-center font-medium py-6">
            ✅ Refund request submitted successfully. We’ll review it within 2–3
            business days.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Refund Amount */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Refund Amount
              </label>
              <input
                type="text"
                value={`${formattedAmount}`}
                readOnly
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-semibold border border-gray-300 focus:outline-none"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Reason for refund
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

            {/* Hidden fields */}
            <input type="hidden" name="bookingId" value={bookingId} />
            <input type="hidden" name="refundAmount" value={refundAmount} />
            <input type="hidden" name="numStudents" value={numStudents} />
            <input type="hidden" name="oldTotal" value={oldTotal} />
            <input type="hidden" name="newTotal" value={newTotal} />
            <input type="hidden" name="reason" value={reason} />

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
                pendingLabel="Submitting..."
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold shadow-md transition"
              >
                Submit Refund
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
