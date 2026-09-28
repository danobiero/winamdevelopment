'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FormatCurrency } from '@/app/_lib/utils';
import { beginRedemptionAdmin } from './actions';

export default function ViewInvestmentModal({ investment }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Solves the "one day ahead" issue by forcing Central Time display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    );
  };

  const formattedInvested = FormatCurrency(investment.amount_invested);
  const formattedCommitted = FormatCurrency(investment.total_committed);

  const isRedemption =
    investment.status?.toUpperCase() === 'REDEMPTION' ||
    investment.status?.toUpperCase() === 'EXITED';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
      {/* Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col relative overflow-hidden">
        {/* Header - Sticky */}
        <div className="px-4 sm:px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            Investment Details
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-gray-700">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Investment ID
              </p>
              <p className="font-mono text-sm">#{investment.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Status
              </p>
              <span
                className={`inline-block px-2 py-0.5 mt-0.5 rounded text-sm font-medium border ${
                  isRedemption
                    ? 'bg-red-100 text-red-700 border-red-200'
                    : investment.status?.toUpperCase() === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : 'bg-orange-100 text-orange-700 border-orange-200'
                }`}
              >
                {investment.status || 'PENDING'}
              </span>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-3">
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Opportunity:</span>
              <span className="font-semibold text-right">
                {investment.opportunities?.name || 'Unknown'}
              </span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Shareholder:</span>
              <span className="font-semibold text-right">
                {investment.shareholders?.fullName || 'Unknown'}
              </span>
            </p>

            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Timeline:</span>
              <span className="font-semibold text-right text-sm">
                {formatDate(investment.start_date)} →{' '}
                {investment.end_date ? (
                  formatDate(investment.end_date)
                ) : (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs uppercase font-black">
                    OPEN
                  </span>
                )}
              </span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Total Committed:</span>
              <span className="font-semibold text-right">
                {formattedCommitted}
              </span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500 font-bold">Amount Invested:</span>
              <span className="font-bold text-lg text-blue-600">
                {formattedInvested}
              </span>
            </p>
          </div>

          {/* ---- Redemption History ---- */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">
              Redemption History
            </h3>
            {investment.redemption_requests?.length ? (
              <ul className="space-y-3">
                {investment.redemption_requests.map((redemption) => {
                  // Color Mapping logic based on your likely redemption statuses
                  const statusColors = {
                    completed: 'bg-green-100 text-green-700 border-green-200',
                    processed: 'bg-green-100 text-green-700 border-green-200',
                    pending: 'bg-blue-100 text-blue-700 border-blue-200',
                    rejected: 'bg-red-100 text-red-700 border-red-200',
                  };
                  const colorClass =
                    statusColors[redemption.status?.toLowerCase()] ||
                    'bg-gray-100 text-gray-600 border-gray-200';

                  return (
                    <li
                      key={redemption.id}
                      className="border p-3 rounded-lg bg-gray-50 text-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">
                          🏦 {FormatCurrency(redemption.amount)}{' '}
                          {redemption.currency}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`capitalize px-2 py-0.5 rounded text-xs font-bold border ${colorClass}`}
                          >
                            {redemption.status}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">
                            {formatDate(redemption.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 italic">
                        "{redemption.reason_code || 'No reason provided'}"
                      </p>
                      {redemption.admin_notes && (
                        <p className="text-gray-500 text-xs mt-2 border-t pt-2">
                          <span className="font-semibold text-gray-600">
                            Note:
                          </span>{' '}
                          {redemption.admin_notes}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm italic">
                No redemption requests found
              </p>
            )}
          </div>

          {/* ---- Actions ---- */}
          <div className="pt-4 space-y-3">
            {!isRedemption ? (
              <button
                onClick={() => setConfirmOpen(true)}
                className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors"
              >
                Begin Redemption
              </button>
            ) : (
              <div className="p-3 bg-red-50 text-red-700 text-center rounded-lg border border-red-100 font-bold">
                Redemption Process Began on {formatDate(investment.exited_at)}
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Confirmation Overlay */}
        {confirmOpen && (
          <ConfirmationModal
            investmentId={investment.id}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function ConfirmationModal({ investmentId, onCancel }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-6 border animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Begin Redemption</h3>
        <div className="text-sm text-gray-600 mb-6 leading-relaxed space-y-2">
          <p>This will initiate the redemption process for this investment.</p>
          <div className="p-2 bg-red-50 border border-red-100 rounded text-red-700 font-bold text-xs">
            ⚠️ WARNING: This process cannot be reversed once started.
          </div>
        </div>

        <form action={beginRedemptionAdmin} className="space-y-3">
          <input type="hidden" name="investmentId" value={investmentId} />

          <button
            type="submit"
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 active:scale-95 transition-all"
          >
            Yes, Begin Redemption
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200"
          >
            No, Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
