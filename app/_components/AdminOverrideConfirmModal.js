'use client';

import React from 'react';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

export default function AdminOverrideConfirmModal({
  isOpen,
  targetMember = null,
  isBulk = false,
  pendingCount = 0,
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  const title = isBulk
    ? `Admin Override All Pending Consents?`
    : `Admin Override Consent for ${targetMember?.member_name || 'Member'}?`;

  const memberDisplayName = isBulk
    ? `All ${pendingCount} Remaining Pending Member(s)`
    : (targetMember?.member_name || 'Participating Member');

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col space-y-5 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning / Security Icon Badge */}
        <div className="flex items-center justify-center w-14 h-14 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl mx-auto shadow-inner border border-purple-200 dark:border-purple-800/60">
          {isBulk ? (
            <UserGroupIcon className="h-7 w-7" />
          ) : (
            <ShieldCheckIcon className="h-7 w-7" />
          )}
        </div>

        {/* Text Header */}
        <div className="text-center space-y-1.5">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            This administrative action will formally grant written consent and waive the Right of First Refusal (ROFR) pursuant to Section 5.2 and Section 5.3.
          </p>
        </div>

        {/* Details Card */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 space-y-2.5 text-left text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              Target Member(s):
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {memberDisplayName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Opportunity:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Winam USA Land Purchase Project
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Recorded Signature:</span>
            <span className="px-2 py-0.5 rounded font-black font-mono text-[11px] bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Admin Override
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Contract Terms:</span>
            <span className="font-medium text-slate-600 dark:text-slate-300">
              Section 5.2 (Unanimous Consent) & 5.3 (ROFR)
            </span>
          </div>
        </div>

        {/* Warning Callout Notice */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Audit Record:</strong> This action will be documented as{' '}
            <strong>"Admin Override"</strong> in the permanent ledger to unlock the redemption workflow.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-purple-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <ShieldCheckIcon className="h-4 w-4" />
                <span>Confirm Override</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
