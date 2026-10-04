'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { processRedemptionAdmin } from './redemption-actions';
import {
  submitAdminPart6Approval,
  adminOverrideMemberConsent,
} from '@/app/_lib/withdrawal-form-actions';
import MemberWithdrawalModal from '@/app/_components/MemberWithdrawalModal';
import AdminOverrideConfirmModal from '@/app/_components/AdminOverrideConfirmModal';
import {
  LockClosedIcon,
  CheckCircleIcon,
  ScaleIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

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
  withdrawalForm = null,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionState, setActionState] = useState('idle'); // 'idle' | 'rejecting'

  // Part 6 Admin Signatures state
  const [pmSig, setPmSig] = useState(
    withdrawalForm?.part6_admin?.pmSignature || ''
  );
  const [officerSig, setOfficerSig] = useState(
    withdrawalForm?.part6_admin?.officerSignature || ''
  );
  const [isSavingPart6, setIsSavingPart6] = useState(false);
  const [part6Success, setPart6Success] = useState(
    Boolean(withdrawalForm?.part6_admin?.isCompleted)
  );
  const [showFullDoc, setShowFullDoc] = useState(false);
  const [showConsentsDetail, setShowConsentsDetail] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);

  // Guard clause to prevent undefined errors
  if (!redemption) return null;

  const handleSavePart6 = async (e) => {
    e.preventDefault();
    if (!pmSig.trim() || !officerSig.trim()) {
      alert('Both Project Manager and Authorized Company Officer signatures are required.');
      return;
    }
    try {
      setIsSavingPart6(true);
      await submitAdminPart6Approval({
        formId: withdrawalForm.id,
        pmSignature: pmSig,
        officerSignature: officerSig,
      });
      setPart6Success(true);
    } catch (err) {
      alert(err.message || 'Failed to record administrative approval.');
    } finally {
      setIsSavingPart6(false);
    }
  };

  const handleAdminOverride = (member) => {
    setOverrideTarget({ member, isBulk: false });
  };

  const handleAdminOverrideAll = () => {
    const pendingCount = withdrawalForm?.consents?.filter((c) => !c.has_consented).length || 0;
    setOverrideTarget({ isBulk: true, pendingCount });
  };

  const handleConfirmAdminOverride = async () => {
    if (!overrideTarget) return;
    const { member, isBulk } = overrideTarget;

    try {
      setIsSubmitting(true);
      if (isBulk) {
        await adminOverrideMemberConsent({
          formId: withdrawalForm.id,
          overrideAll: true,
          reason: 'Admin Override - Process completed to unlock flow',
        });
      } else {
        await adminOverrideMemberConsent({
          formId: withdrawalForm.id,
          shareholderId: member.shareholder_id || member.member_name,
          reason: 'Admin Override - Process completed to unlock flow',
        });
      }
      setOverrideTarget(null);
      router.refresh();
    } catch (err) {
      alert(err.message || 'Failed to record Admin Override.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    if (withdrawalForm && !part6Success) {
      alert('Part 6 (Company Administrative Approval) must be completed before processing payout.');
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete('redemption'); // Clear this modal
    params.set('approved', redemption.id); // Trigger the Stripe Payment Choice modal
    router.push(`/admin/redemptions?approved=${redemption.id}`);
  };

  const isPending = redemption.status?.toLowerCase() === 'pending';
  const requiresPart6 = Boolean(withdrawalForm);
  const isPart6Done = requiresPart6 ? part6Success : true;

  return (
    <>
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

          {/* USA Land Project Withdrawal Form Card */}
          {withdrawalForm && (
            <div className="mt-4 border-2 border-blue-200 bg-blue-50/30 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                    <DocumentTextIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      MEMBER WITHDRAWAL & INTEREST DISPOSITION FORM
                    </h3>
                    <p className="text-[11px] text-blue-800 font-medium">
                      USA Land Purchase Project • Section 5 & 6 Protocol
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullDoc(true)}
                  className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  View Full 2-Page Document
                </button>
              </div>

              {/* Status Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* 30-Day Clock */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Notice Period</p>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5 text-amber-500" />
                    <span>{withdrawalForm.daysRemaining ?? 30} Days Left</span>
                  </p>
                </div>

                {/* Page 1 Status */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Page 1 (Member)</p>
                  <p className={`font-bold flex items-center gap-1 ${
                    withdrawalForm.page1_data?.submittedAt ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {withdrawalForm.page1_data?.submittedAt ? '✓ Submitted' : '⏳ Pending Submission'}
                  </p>
                </div>

                {/* Part 5 Consents */}
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Part 5 Consents</p>
                  <p className="font-bold text-slate-800">
                    {Array.isArray(withdrawalForm.consents)
                      ? `${withdrawalForm.consents.filter((c) => c.has_consented).length} of ${withdrawalForm.consents.length} Signed`
                      : '0 of 8 Signed'}
                  </p>
                </div>
              </div>

              {/* Consents Breakdown Toggle */}
              {Array.isArray(withdrawalForm.consents) && withdrawalForm.consents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConsentsDetail(!showConsentsDetail)}
                      className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {showConsentsDetail ? '▼ Hide' : '▶ View'} Member Consents Breakdown (
                        {withdrawalForm.consents.filter((c) => c.has_consented).length}/
                        {withdrawalForm.consents.length})
                      </span>
                    </button>

                    {withdrawalForm.consents.some((c) => !c.has_consented) && (
                      <button
                        type="button"
                        onClick={handleAdminOverrideAll}
                        disabled={isSubmitting}
                        className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white transition-all cursor-pointer shadow-2xs"
                      >
                        Admin Override All
                      </button>
                    )}
                  </div>

                  {showConsentsDetail && (
                    <div className="mt-2 bg-white rounded-xl border border-slate-200 p-2.5 space-y-2 max-h-48 overflow-y-auto">
                      {withdrawalForm.consents.map((c, i) => {
                        const isOverridden = Boolean(c.is_admin_override || c.signature === 'Admin Override');
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs py-1 border-b last:border-none gap-2"
                          >
                            <span className="font-medium text-slate-700">{c.member_name}</span>
                            <div className="flex items-center gap-2">
                              {c.has_consented ? (
                                isOverridden ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                                    Admin Override
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <CheckCircleIcon className="h-3.5 w-3.5" /> Consented ({new Date(c.signed_at).toLocaleDateString()})
                                  </span>
                                )
                              ) : (
                                <>
                                  <span className="text-slate-400 italic">Pending</span>
                                  <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={() => handleAdminOverride(c)}
                                    className="px-2 py-0.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded text-[10px] uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
                                  >
                                    Admin Override
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PART 6: COMPANY ADMINISTRATIVE APPROVAL FORM */}
              <div className="bg-white rounded-xl border-2 border-blue-200 p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Part 6: Company Administrative Approval
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    part6Success
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200 font-black'
                  }`}>
                    {part6Success ? '✓ Completed' : 'Action Required'}
                  </span>
                </div>

                {part6Success ? (
                  <div className="space-y-2 text-xs bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                    <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircleIcon className="h-4 w-4" /> Part 6 Signatures Recorded & Verified
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-700">Project Manager:</span> {pmSig || 'Jephline Okoth'}
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Authorized Officer:</span> {officerSig || 'Daniel Obiero'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSavePart6} className="space-y-3 text-xs">
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Before this redemption can be processed, administrative sign-off must be completed pursuant to Section 3.1 & Section 4.3:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Project Manager (Jephline Okoth) Signature *
                        </label>
                        <input
                          type="text"
                          required
                          value={pmSig}
                          onChange={(e) => setPmSig(e.target.value)}
                          placeholder="Type 'Jephline Okoth' as digital signature"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-serif italic text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Company Officer (Daniel Obiero) Signature *
                        </label>
                        <input
                          type="text"
                          required
                          value={officerSig}
                          onChange={(e) => setOfficerSig(e.target.value)}
                          placeholder="Type 'Daniel Obiero' as digital signature"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-serif italic text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={isSavingPart6 || !pmSig.trim() || !officerSig.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      >
                        {isSavingPart6 ? 'Saving Signatures...' : 'Save & Approve Part 6'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

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
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t space-y-3 shrink-0">
            {/* STATE 1: Idle */}
            {actionState === 'idle' && (
              <div className="space-y-3">
                {!isPart6Done && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-amber-900 text-xs">
                    <LockClosedIcon className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="font-medium">
                      <strong>Payout Locked:</strong> Part 6 (Company Administrative Approval) must be completed above before this redemption can be processed. It remains pending.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActionState('rejected')}
                    className="flex-1 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition-all active:scale-[0.98] shadow-sm cursor-pointer"
                  >
                    Reject Request...
                  </button>
                  <button
                    type="button"
                    disabled={!isPart6Done}
                    onClick={handleApprove}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
                      isPart6Done
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }`}
                  >
                    {isPart6Done ? 'Approve & Process Payout →' : '🔒 Complete Part 6 First'}
                  </button>
                </div>
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

      {/* Admin Override Confirmation Modal */}
      <AdminOverrideConfirmModal
        isOpen={Boolean(overrideTarget)}
        targetMember={overrideTarget?.member}
        isBulk={Boolean(overrideTarget?.isBulk)}
        pendingCount={overrideTarget?.pendingCount}
        isSubmitting={isSubmitting}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleConfirmAdminOverride}
      />
    </>
  );
}
