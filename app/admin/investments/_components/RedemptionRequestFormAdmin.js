'use client';

import { useState, useTransition, useEffect } from 'react';
import { requestRedemptionAdmin } from '@/app/_lib/actions'; // Shift server action reference
import SubmitButton from '@/app/_components/SubmitButton';

// Reusable currency formatter instance matching x,xxx,xxx.xx format
const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function RedemptionRequestFormAdmin({
  investmentId,
  redemptionAmount,
  oldTotal,
  newTotal,
  onClose,
}) {
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const formattedAmount = currencyFormatter.format(redemptionAmount || 0);
  const formattedOldTotal = currencyFormatter.format(oldTotal || 0);
  const formattedNewTotal = currencyFormatter.format(newTotal || 0);

  // ✅ Prefill reason automatically when modal opens matching shareholder events
  useEffect(() => {
    const autoReason = `Capital reduction — updated investment principal from $${formattedOldTotal} to $${formattedNewTotal}.`;
    setReason(autoReason);
  }, [oldTotal, newTotal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const finalReason = reason.trim();

    startTransition(async () => {
      try {
        await requestRedemptionAdmin({
          investmentId,
          redemptionAmount,
          reason: finalReason,
          oldTotal,
          newTotal,
        });

        setIsSubmitted(true);
        setTimeout(() => onClose?.(true), 1500);
      } catch (err) {
        console.error('Redemption execution failure:', err);
        setErrorMessage(
          'There was a system issue requesting this capital redemption. Please try again.'
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm p-4">
      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative border border-gray-200">
        {/* Header */}
        <h2 className="text-2xl font-semibold mb-2 text-center text-primary-800">
          Admin Redemption Request
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          You’re processing a partial capital redemption for Investment{' '}
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
            ✅ Redemption request submitted successfully. The capital payout
            queue will update within 2–3 business days.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Redemption Amount */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Redemption Capital Payout
              </label>
              <input
                type="text"
                value={`$${formattedAmount}`}
                readOnly
                className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-900 font-bold border border-gray-300 focus:outline-none"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Reason for capital reduction
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

            {/* Hidden tracking elements */}
            <input type="hidden" name="investmentId" value={investmentId} />
            <input
              type="hidden"
              name="redemptionAmount"
              value={redemptionAmount}
            />
            <input type="hidden" name="oldTotal" value={oldTotal} />
            <input type="hidden" name="newTotal" value={newTotal} />
            <input type="hidden" name="reason" value={reason} />

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => onClose?.(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium shadow-sm transition text-sm"
              >
                Cancel
              </button>

              <SubmitButton
                pendingLabel="Submitting..."
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold shadow-md transition text-sm"
              >
                Submit Redemption
              </SubmitButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
