'use client';

import React from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ScaleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function ContractConstructModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <ScaleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Contract Construct & Legal Provisions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Winam USA Land Purchase Project • Project Participation Agreement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Close contract construct"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Legal Clauses Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-sans">
          {/* Quick Notice Banner */}
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl flex items-start gap-2.5">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-900 dark:text-blue-200 text-xs font-medium">
              This contract construct governs the redemption, withdrawal, and disposition of member interest for the Winam USA Land Purchase Project pursuant to the master agreement effective March 1, 2026.
            </p>
          </div>

          {/* Section 5 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-xs">
                SECTION 5
              </span>
              <span>Term, Withdrawal & Member Exit Rights</span>
            </h4>
            <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <p>
                <strong>5.1 Notice Period & Expiration:</strong> Any Participating Member seeking to withdraw from the Winam USA Land Purchase Project must deliver a formal written notice of withdrawal. From the date of initiation, an active thirty (30) calendar day window applies for the submission of documentation, member review, and execution of consents.
              </p>
              <p>
                <strong>5.2 Unanimous Written Consent Requirement:</strong> Pursuant to Section 5.2: <em>"No Participating Member may withdraw or transfer their interest without prior written consent of all others."</em> All remaining Participating Members in the Special Project must execute written consent or waiver prior to any disbursement of funds or transfer of shares.
              </p>
              <p>
                <strong>5.3 Right of First Refusal (ROFR):</strong> <em>&quot;If a Member wishes to transfer their interest, the remaining Members shall have the right of first refusal on the same terms.&quot;</em> The remaining Members hold priority to acquire the departing member&apos;s pro-rata project interest (e.g. 1/N share based on participating member count) pro-rata or by mutual allocation at the established valuation before any transfer to an outside party.
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-xs">
                SECTION 6
              </span>
              <span>Method of Interest Disposition</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-1">Option A: Member Buyout</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Acquisition of the withdrawing member's share by one or more remaining Participating Members exercising their Section 5.3 Right of First Refusal at an agreed price.
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-1">Option B: Company Redemption</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Winam Development Group, LLC acquires and retires the member&apos;s pro-rata project interest into the company treasury for the agreed redemption valuation (\$1,000.00 capital return).
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white mb-1">Option C: Third-Party Transfer</p>
                <p className="text-slate-600 dark:text-slate-400">
                  Transfer of interest to an approved incoming new member, strictly conditional upon unanimous written consent of all remaining Participating Members.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 & 4 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-xs">
                SECTIONS 3 & 4
              </span>
              <span>Surrender of Rights & Project Accounting Settlement</span>
            </h4>
            <div className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <p>
                <strong>Surrender of Rights:</strong> Effective immediately upon full receipt of the agreed settlement payout, the Withdrawing Member formally relinquishes all right, title, interest, voting privileges, dividend allocations, and future distribution entitlements in the Winam USA Land Purchase Project.
              </p>
              <p>
                <strong>Section 4.3 Disbursement Protocol:</strong> Disbursement of funds from the dedicated Project Account requires dual formal verification and sign-off by the Finance Officer and Project Manager.
              </p>
            </div>
          </div>

          {/* Section 7 */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-3">
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-mono text-xs">
                SECTION 7
              </span>
              <span>Full & Final Mutual Release and Indemnification</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              The Withdrawing Member irrevocably releases and discharges Winam Development Group, LLC, its officers, managers, and remaining Participating Members from any and all claims, debts, liabilities, demands, or obligations arising out of or related to the Project. Winam Development Group, LLC provides reciprocal release upon completion of the redemption settlement.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close Contract Reference
          </button>
        </div>
      </div>
    </div>
  );
}
