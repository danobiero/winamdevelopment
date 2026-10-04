'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  ExclamationTriangleIcon,
  LockClosedIcon,
  BuildingOffice2Icon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { FormatCurrency } from '@/app/_lib/utils';
import { beginRedemptionAdmin } from './actions';

export default function ViewInvestmentModal({ investment }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showOtherOppsModal, setShowOtherOppsModal] = useState(false);

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

  const handleSwitchInvestment = (otherInvId) => {
    setShowOtherOppsModal(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', String(otherInvId));
    router.replace(`${pathname}?${params.toString()}`);
  };

  const formattedInvested = FormatCurrency(investment.amount_invested);
  const formattedCommitted = FormatCurrency(investment.total_committed);

  const isRedemption =
    investment.status?.toUpperCase() === 'REDEMPTION' ||
    investment.status?.toUpperCase() === 'EXITED';

  // Rule: Opportunity type 'core' cannot begin redemption if shareholder participates in other opportunity types
  const isCoreOpportunity =
    (investment.opportunities?.type || '').toLowerCase().trim() === 'core';

  const otherParticipatingInvestments = useMemo(() => {
    if (!investment.otherInvestments) return [];
    return investment.otherInvestments.filter((inv) => {
      const oppType = (inv.opportunities?.type || '').toLowerCase().trim();
      const isExited = (inv.status || '').toLowerCase() === 'exited';
      const isFee = oppType === 'fees' || oppType === 'fee';
      const isCore = oppType === 'core';
      const hasBalance = Number(inv.amount_invested || 0) > 0;
      return !isCore && !isFee && !isExited && hasBalance;
    });
  }, [investment.otherInvestments]);

  const isRedemptionBlockedForCore =
    isCoreOpportunity && otherParticipatingInvestments.length > 0;

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
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
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
                {investment.opportunities?.name || 'Unknown'}{' '}
                {investment.opportunities?.type && (
                  <span className="ml-1.5 px-2 py-0.5 rounded text-xs font-mono uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {investment.opportunities.type}
                  </span>
                )}
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
            {isRedemption ? (
              <div className="p-3 bg-red-50 text-red-700 text-center rounded-lg border border-red-100 font-bold">
                Redemption Process Began on {formatDate(investment.exited_at)}
              </div>
            ) : isRedemptionBlockedForCore ? (
              <div className="space-y-3">
                {/* Restriction Message Box with Interactive Message Button */}
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-amber-950">
                        Redemption Restricted (Core Opportunity)
                      </h4>
                      <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                        Redemption is not allowed for the <strong>Core Portfolio</strong> because this shareholder participates in other opportunity types ({otherParticipatingInvestments.length} active).
                      </p>
                    </div>
                  </div>

                  {/* Clickable Message Button */}
                  <button
                    type="button"
                    onClick={() => setShowOtherOppsModal(true)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer group"
                    title="Click to view other opportunities the shareholder has invested in"
                  >
                    <div className="flex items-center gap-2">
                      <BuildingOffice2Icon className="h-4 w-4 text-amber-200" />
                      <span>View Other Invested Opportunities ({otherParticipatingInvestments.length})</span>
                    </div>
                    <span className="text-amber-100 text-[11px] group-hover:translate-x-0.5 transition-transform font-mono">
                      View list &rarr;
                    </span>
                  </button>
                </div>

                {/* Disabled Begin Redemption Button */}
                <button
                  type="button"
                  disabled
                  className="w-full px-4 py-3 bg-gray-100 text-gray-400 font-bold rounded-lg cursor-not-allowed border border-gray-200 flex items-center justify-center gap-2"
                  title="Begin Redemption is locked because this shareholder participates in other opportunity types"
                >
                  <LockClosedIcon className="h-4 w-4" />
                  <span>Begin Redemption (Locked)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmOpen(true)}
                className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
              >
                Begin Redemption
              </button>
            )}

            <Link
              href="/admin/redemptions"
              className="block w-full py-2.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 text-center rounded-lg border border-blue-200 font-bold text-xs transition-colors"
            >
              Go to Redemptions Queue &rarr;
            </Link>

            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Confirmation Overlay */}
        {confirmOpen && (
          <ConfirmationModal
            investmentId={investment.id}
            opportunityName={investment.opportunities?.name}
            onCancel={() => setConfirmOpen(false)}
          />
        )}

        {/* Other Opportunities Modal */}
        {showOtherOppsModal && (
          <OtherOpportunitiesModal
            shareholderName={investment.shareholders?.fullName || 'Shareholder'}
            otherInvestments={investment.otherInvestments || []}
            activeOtherCount={otherParticipatingInvestments.length}
            onClose={() => setShowOtherOppsModal(false)}
            onSelectInvestment={handleSwitchInvestment}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
}

function OtherOpportunitiesModal({
  shareholderName,
  otherInvestments,
  activeOtherCount,
  onClose,
  onSelectInvestment,
  formatDate,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Other Invested Opportunities
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Shareholder: <strong className="text-slate-800">{shareholderName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 min-h-0 custom-scrollbar">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
            ⚠️ <strong>Redemption Policy Notice:</strong> This shareholder actively holds{' '}
            <strong>{activeOtherCount}</strong> investment(s) in other opportunity types. As per portfolio rules, the{' '}
            <strong>Core Portfolio</strong> cannot be redeemed until participation in other opportunity types is exited or cleared.
          </div>

          <div className="space-y-2.5">
            {otherInvestments.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">
                No other investments found for this shareholder.
              </p>
            ) : (
              otherInvestments.map((inv) => {
                const oppName = inv.opportunities?.name || `Opportunity #${inv.opportunity_id}`;
                const oppType = inv.opportunities?.type || 'Portfolio';
                const isExited = (inv.status || '').toLowerCase() === 'exited';
                const isCore = (oppType || '').toLowerCase() === 'core';

                return (
                  <div
                    key={inv.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isExited
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isCore
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-blue-200 shadow-2xs hover:border-blue-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          {oppName}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                            {oppType}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isExited
                                ? 'bg-slate-200 text-slate-600'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {inv.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-slate-900 block">
                          {FormatCurrency(inv.amount_invested)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Inv #{inv.id}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
                      <span className="text-[11px]">
                        Committed: <strong>{FormatCurrency(inv.total_committed)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectInvestment(inv.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <span>View Investment</span>
                        <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmationModal({ investmentId, opportunityName, onCancel }) {
  const isUsaLand = opportunityName?.toLowerCase().includes('usa land');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-6 border animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Begin Redemption</h3>
        <div className="text-sm text-gray-600 mb-6 leading-relaxed space-y-2">
          <p>This will initiate the redemption process for this investment.</p>
          {isUsaLand && (
            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 font-semibold text-xs">
              📋 <strong>USA Land Project:</strong> Activates the 30-day Member Withdrawal & Interest Disposition Form workflow for this shareholder and co-investors.
            </div>
          )}
          <div className="p-2 bg-red-50 border border-red-100 rounded text-red-700 font-bold text-xs">
            ⚠️ WARNING: This process cannot be reversed once started.
          </div>
        </div>

        <form
          action={beginRedemptionAdmin}
          onSubmit={(e) => {
            if (isSubmitting) {
              e.preventDefault();
              return;
            }
            setIsSubmitting(true);
          }}
          className="space-y-3"
        >
          <input type="hidden" name="investmentId" value={investmentId} />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin text-white" />
                <span>Initiating Redemption...</span>
              </>
            ) : (
              <span>Yes, Begin Redemption</span>
            )}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
          >
            No, Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
