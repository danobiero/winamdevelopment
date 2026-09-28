'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { processRedemptionAdmin } from './redemption-actions';

// Helper to format currency consistently
const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(value);

export default function RedemptionProcessModal({
  redemption,
  ledger = [],
  rejectionPolicies = [],
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionState, setActionState] = useState('idle'); // 'idle' | 'rejecting'

  // Guard clause to prevent undefined errors
  if (!redemption) return null;

  const handleClose = () => {
    // Navigates back, clearing only the redemption param so we don't lose page state
    const params = new URLSearchParams(searchParams.toString());
    params.delete('redemption');
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    );
  };

  // NEW: Handler to jump to the Stripe Approval flow
  const handleApprove = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('redemption'); // Clear this modal
    params.set('approved', redemption.id); // Trigger the Stripe Payment Choice modal
    router.push(`/admin/redemptions?approved=${redemption.id}`);
   
  };

  const isPending = redemption.status?.toLowerCase() === 'pending';

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {isPending ? 'Process Redemption' : 'Redemption Details'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Request ID
              </p>
              <p className="font-mono text-sm text-gray-700">
                #{String(redemption.id).slice(0, 8)}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                redemption.status === 'completed'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : redemption.status === 'rejected'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
              }`}
            >
              {redemption.status || 'pending'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              {/* Added: Displaying the opportunity name */}
              <p
                className="font-semibold text-gray-800 text-sm truncate"
                title={redemption.investments?.opportunities?.name}
              >
                {redemption.investments?.opportunities?.name ||
                  'Unknown Opportunity'}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Investment ID
              </p>
              <p className="font-semibold text-blue-600">
                #{redemption.investment_id}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Requested Amount
              </p>
              <p className="font-bold text-gray-900 text-base">
                {formatCurrency(redemption.amount, redemption.currency)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Shareholder
            </p>
            <p className="text-gray-800 font-medium">
              {redemption.shareholders?.fullName || 'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Reason Code
            </p>
            <div className="mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-700 font-medium">
              {redemption.reason_code ||
                'No specific reason provided by shareholder.'}
            </div>
          </div>

          {/* Investment Ledger Table */}
          <div className="mt-6 bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              Investment Financial Ledger
            </h3>

            {ledger.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                No ledger activity recorded for this investment.
              </p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-2 font-semibold">Date</th>
                    <th className="text-left py-2 font-semibold">Type</th>
                    <th className="text-right py-2 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row, i) => (
                    <tr
                      key={row.entry_id || i}
                      className="border-b last:border-none"
                    >
                      <td className="py-2 text-gray-600">
                        {new Date(row.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="py-2">
                        <span
                          className={`capitalize px-2 py-0.5 rounded text-xs font-bold ${
                            row.entry_type === 'investment'
                              ? 'bg-green-50 text-green-700 border border-green-100'
                              : 'bg-violet-50 text-violet-700 border border-violet-100'
                          }`}
                        >
                          {row.entry_type}
                        </span>
                      </td>
                      <td
                        className={`py-2 text-right font-bold ${
                          row.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(row.amount, row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Read-Only Processed Notes */}
          {!isPending && (
            <div className="space-y-4 pt-4 border-t">
              {redemption.status === 'rejected' &&
                redemption.redemption_rejection_policies && (
                  <div>
                    <p className="text-xs font-bold text-red-500 uppercase tracking-widest">
                      Rejection Policy
                    </p>
                    <p className="text-sm text-red-700 font-semibold mt-1">
                      {redemption.redemption_rejection_policies.code} -{' '}
                      {redemption.redemption_rejection_policies.title}
                    </p>
                  </div>
                )}

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Admin Notes
                </p>
                <p className="text-sm text-gray-600 italic mt-1">
                  {redemption.admin_notes || 'No notes added.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Submitted
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(redemption.created_at).toLocaleString()}
                  </p>
                </div>
                {redemption.processed_at && (
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Processed
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(redemption.processed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Sticky */}
        {isPending ? (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t space-y-4 shrink-0">
            {/* STATE 1: Idle */}
            {actionState === 'idle' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActionState('rejected')}
                  className="flex-1 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition-all active:scale-[0.98] shadow-sm"
                >
                  Reject Request...
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-[0.98] shadow-sm"
                >
                  Approve & Process Payout &rarr;
                </button>
              </div>
            )}

            {/* STATE 2: Rejecting */}
            {actionState === 'rejected' && (
              <form
                action={async (formData) => {
                  setIsSubmitting(true);
                  await processRedemptionAdmin(formData);
                  handleClose();
                }}
                className="space-y-4 animate-in slide-in-from-bottom-2 duration-200"
              >
                <input
                  type="hidden"
                  name="redemptionId"
                  value={redemption.id}
                />

                <div>
                  <label className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-1">
                    Select Rejection Policy *
                  </label>
                  <select
                    name="rejectionPolicyId"
                    required
                    className="w-full border border-red-200 bg-red-50/30 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none font-medium"
                  >
                    <option value="">Select a reason code...</option>
                    {rejectionPolicies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    name="admin_notes"
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Add context for this rejection..."
                  />
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setActionState('idle')}
                    className="flex-1 bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="rejected"
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t shrink-0">
            <button
              onClick={handleClose}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98] shadow-md"
            >
              CLOSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
