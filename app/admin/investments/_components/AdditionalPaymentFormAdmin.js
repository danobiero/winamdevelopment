'use client';

import { useState, useTransition, useEffect } from 'react';
import { additionalPaymentAdmin } from '@/app/_lib/actions';
import SubmitButton from '@/app/_components/SubmitButton';

// Reusable currency formatter instance
const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function AdditionalPaymentFormAdmin({
  investmentId,
  paymentAmount,
  oldTotal,
  newTotal,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  // Dynamic formatting using the format instance
  const formattedAmount = currencyFormatter.format(paymentAmount || 0);

  // Automatically pre-fills historical investment ledger changes using the commas format
  useEffect(() => {
    const autoReason = `Increased asset allocation position. Principal adjusted from $${currencyFormatter.format(oldTotal || 0)} up to $${currencyFormatter.format(newTotal || 0)}.`;
    setReason(autoReason);
  }, [oldTotal, newTotal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const finalReason = reason.trim();

    startTransition(async () => {
      try {
        const session = await additionalPaymentAdmin({
          investmentId,
          difference: paymentAmount,
          reason: finalReason,
          oldTotal,
          newTotal,
        });

        setIsSubmitted(true);

        if (session?.url) {
          setTimeout(() => onClose?.(true), 1000);
          window.location.href = session.url;
        } else {
          setErrorMessage('Failed to connect to pay gateway. Please retry.');
        }
      } catch (err) {
        console.error('Capital injection execution failure:', err);
        setErrorMessage(
          'There was a system issue requesting this secure asset allocation increase.'
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200">
        {/* Header */}
        <h2 className="text-2xl font-semibold mb-2 text-center text-primary-800">
          Additional Capital Call
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Requesting extra principal injection for Investment{' '}
          <span className="font-semibold text-primary-700">
            #{investmentId}
          </span>
        </p>

        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-2 rounded-md text-center mb-4 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          <div className="text-green-600 text-center font-medium py-6">
            ✅ Capital Call link configured! Routing shareholder to the secure
            payment station...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Added Ledger Funding Target */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Additional Capital Required
              </label>
              <input
                type="text"
                value={`$${formattedAmount}`}
                readOnly
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-bold border border-gray-300 focus:outline-none"
              />
            </div>

            {/* Audit Justification Trail */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Shareholder Audit Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-900 border border-gray-300 focus:outline-none resize-none text-sm"
              />
              <p className="text-xs text-gray-500 text-right mt-1">
                {reason.length}/500
              </p>
            </div>

            {/* Form Controls */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => onClose?.(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium shadow-sm transition text-sm"
              >
                Dismiss
              </button>

              <SubmitButton
                pendingLabel="Processing..."
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white font-semibold shadow-md transition text-sm"
              >
                Issue Capital Call
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
