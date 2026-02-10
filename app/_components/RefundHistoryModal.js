'use client';

import { format } from 'date-fns';
import { FormatCurrency } from '@/app/_lib/utils';

function statusBadge(status) {
  switch (status) {
    case 'succeeded':
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'failed':
    case 'canceled':
    case 'rejected':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-zinc-100 text-zinc-700';
  }
}

export default function RefundHistoryModal({ open, onClose, refunds }) {
  if (!open || !refunds || refunds.length === 0) return null;

  const sortedRefunds = [...refunds].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const totalRefunded = refunds.reduce(
    (sum, r) => sum + (r.refund_amount || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden transition-transform transform duration-300 ease-out">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-primary-50">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-blue-950">Refund History</h2>
            <button
              onClick={onClose}
              className="sm:hidden text-primary-400 hover:text-primary-600 p-1"
            >
              ✕
            </button>
          </div>

          <p className="mt-1 text-sm text-primary-600">
            Total Refunded:{' '}
            <span className="font-bold text-logo-100">
              {FormatCurrency(totalRefunded)}
            </span>
          </p>
        </div>

        {/* Scrollable Refund List */}
        <div className="flex-grow overflow-y-auto p-5 sm:p-6 space-y-3">
          {sortedRefunds.map((refund) => (
            <div
              key={refund.id}
              className="border border-primary-100 rounded-lg p-3 sm:p-4 bg-white hover:border-primary-200 transition-colors"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-sm sm:text-base font-bold text-primary-800">
                    {FormatCurrency(refund.refund_amount)}
                  </p>
                  <p className="text-[11px] text-primary-500 mt-0.5">
                    {format(new Date(refund.created_at), 'MMM dd, yyyy • p')}
                  </p>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[9px]
                  font-bold uppercase tracking-wide shrink-0
                  ${statusBadge(refund.status)}`}
                >
                  {refund.status}
                </span>
              </div>

              {/* Original request reason (optional) */}
              {refund.reason && (
                <div className="mt-2 text-[11px] sm:text-xs text-primary-600 bg-primary-50/50 p-2 rounded">
                  <span className="font-semibold text-primary-700">
                    Request:
                  </span>{' '}
                  {refund.reason}
                </div>
              )}

              {/* Rejection reason (ONLY if rejected) */}
              {refund.status === 'rejected' && (
                <div className="mt-2 text-[11px] sm:text-xs text-red-700 bg-red-50 p-2 rounded border border-red-100">
                  <span className="font-semibold uppercase tracking-wide">
                    Rejected:
                  </span>{' '}
                  {refund.refund_rejection_policies?.title || 'Policy applied'}
                  {refund.rejection_notes && (
                    <>
                      <br />
                      <span className="italic text-red-600">
                        {refund.rejection_notes}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions - Hidden on mobile if header close is used, or kept for clarity */}
        <div className="p-5 sm:p-6 border-t border-primary-50 bg-slate-50/30 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold rounded-lg
            bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
