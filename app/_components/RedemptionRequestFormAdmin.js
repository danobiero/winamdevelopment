'use client';

import { useState, useTransition, useEffect } from 'react';
import { requestRedemptionAdmin } from '@/app/_lib/actions';
import SubmitButton from '@/app/_components/SubmitButton';
import { FormatCurrency } from '../_lib/utils';

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

  const formattedAmount = FormatCurrency(redemptionAmount || 0);
  const formattedOldTotal = FormatCurrency(oldTotal);
  const formattedNewTotal = FormatCurrency(newTotal);

  useEffect(() => {
    const autoReason = `Investment adjustment — updated commitment from ${formattedOldTotal} to ${formattedNewTotal}.`;
    setReason(autoReason);
  }, [oldTotal, newTotal, formattedOldTotal, formattedNewTotal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    const finalReason = reason.trim();

    startTransition(async () => {
      try {
        await requestRedemptionAdmin({
          investmentId,
          amount: redemptionAmount,
          reason: finalReason,
        });

        setIsSubmitted(true);
        setTimeout(() => onClose?.(true), 1500);
      } catch (err) {
        console.error('Redemption request failed:', err);
        setErrorMessage(
          'There was a problem submitting your redemption request. Please try again.'
        );
      }
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-8 max-h-[90vh] overflow-y-auto relative border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-black mb-2 text-center text-blue-900">
          Admin Redemption
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Requesting redemption for Investment{' '}
          <span className="font-mono text-blue-600 font-bold">
            #{investmentId}
          </span>
        </p>

        {errorMessage && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-center mb-4 text-sm">
            {errorMessage}
          </div>
        )}

        {isSubmitted ? (
          <div className="text-emerald-600 text-center font-bold py-8">
            ✅ Redemption request submitted.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">
                Redemption Amount
              </label>
              <input
                type="text"
                value={formattedAmount}
                readOnly
                className="w-full px-4 py-2 rounded-xl bg-gray-50 font-bold border border-gray-200"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1">
                Reason
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                {reason.length}/500
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => onClose?.(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold text-sm"
              >
                Cancel
              </button>
              <SubmitButton
                pendingLabel="Submitting..."
                disabled={isPending}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm"
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
