'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MemberWithdrawalModal from '@/app/_components/MemberWithdrawalModal';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value ?? 0);

export default function RedemptionViewModal({
  redemption,
  ledger = [],
  withdrawalForm = null,
}) {
  const router = useRouter();
  const [showFullDoc, setShowFullDoc] = useState(false);

  // ADDED: Guard clause to prevent crashes if data is loading
  if (!redemption) return null;

  const handleClose = () => {
    router.push('/admin/redemptions');
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            Redemption Details
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
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

        {/* Scrollable Container */}
        <div className="overflow-y-auto max-h-[70vh]">
          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Request ID
                </p>
                <p className="font-mono text-sm text-gray-700">
                  #{String(redemption.id).slice(0, 8)}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  redemption.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : redemption.status === 'completed'
                      ? 'bg-purple-100 text-purple-700'
                      : redemption.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
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
                  Investment
                </p>
                <p className="font-semibold text-blue-600">
                  #{redemption.investment_id}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Amount
                </p>
                <p className="font-bold text-gray-900">
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

            {/* ADDED: Rejection Policy Block */}
            {redemption.status === 'rejected' &&
              redemption.redemption_rejection_policies && (
                <div>
                  <p className="text-xs font-bold text-red-500 uppercase tracking-widest">
                    Rejection Policy
                  </p>
                  <p className="text-sm font-semibold text-red-700 mt-1">
                    {redemption.redemption_rejection_policies.code} -{' '}
                    {redemption.redemption_rejection_policies.title}
                  </p>
                </div>
              )}

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Admin Notes
              </p>
              <div className="mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 italic">
                {redemption.admin_notes || 'No notes provided.'}
              </div>
            </div>

            {/* USA Land Project Withdrawal Form Card */}
            {withdrawalForm && (
              <div className="mt-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-bold text-slate-900">
                      Withdrawal Form (USA Land Project)
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    {withdrawalForm.daysRemaining ?? 30} Days Left
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Page 1 (Member)</span>
                    <span className={`font-bold ${withdrawalForm.page1_data?.submittedAt ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {withdrawalForm.page1_data?.submittedAt ? '✓ Submitted' : '⏳ Pending'}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Part 6 (Admin)</span>
                    <span className={`font-bold ${withdrawalForm.part6_admin?.isCompleted ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {withdrawalForm.part6_admin?.isCompleted ? '✓ Completed' : 'Pending'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullDoc(true)}
                  className="w-full py-2 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  View Full 2-Page Document
                </button>
              </div>
            )}
          </div>

          {/* Investment Ledger */}
          <div className="mt-2 bg-gray-50/50 border-t p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              Investment Financial Ledger
            </h3>
            {ledger.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                No activity recorded for this investment.
              </p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-1">Date</th>
                    <th className="text-left py-1">Type</th>
                    <th className="text-right py-1">Amount</th>
                    <th className="text-right py-1">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row, i) => (
                    <tr key={i} className="border-b last:border-none">
                      <td className="py-1">
                        {new Date(row.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="py-1 capitalize">{row.entry_type}</td>
                      <td
                        className={`py-1 text-right font-medium ${row.amount < 0 ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {formatCurrency(row.amount, row.currency)}
                      </td>
                      <td className="py-1 text-right font-semibold">
                        {formatCurrency(row.running_balance, row.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Redemption Payout Ledger */}
          <div className="bg-gray-50/50 border-t p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">
              Redemption Payout Ledger
            </h3>
            {!redemption.redemptions_list || redemption.redemptions_list.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                No payout transactions processed yet.
              </p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="text-gray-500 border-b">
                    <th className="text-left py-1">Date</th>
                    <th className="text-left py-1">Payout Method / Ref</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {redemption.redemptions_list.map((row, i) => {
                    const payoutRail = row.metadata?.payout_rail?.toUpperCase() || (row.stripe_refund_id ? 'STRIPE' : 'MANUAL');
                    const refInfo = row.metadata?.reference_number || row.stripe_refund_id || row.description || 'Processed';
                    return (
                      <tr key={i} className="border-b last:border-none">
                        <td className="py-1">
                          {new Date(row.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-1">
                          <span className="inline-flex items-center gap-1.5 font-medium text-xs text-gray-700">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700 border border-slate-200 uppercase text-xs">
                              {payoutRail}
                            </span>
                            <span className="font-mono text-gray-500 truncate max-w-[150px]" title={refInfo}>
                              {refInfo}
                            </span>
                          </span>
                        </td>
                        <td className="py-1 text-right font-medium text-red-600">
                          {formatCurrency(row.amount, row.currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
          <button
            onClick={handleClose}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>

      {/* Full 2-Page Legal Document Modal Viewer */}
      {showFullDoc && withdrawalForm && (
        <MemberWithdrawalModal
          form={withdrawalForm}
          currentShareholderId={null}
          isAdmin={true}
          onClose={() => setShowFullDoc(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
