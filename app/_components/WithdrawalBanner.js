'use client';

import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ScaleIcon,
} from '@heroicons/react/24/solid';
import MemberWithdrawalModal from './MemberWithdrawalModal';

export default function WithdrawalBanner({ forms = [], shareholderId }) {
  const [selectedForm, setSelectedForm] = useState(null);

  // Filter out any forms where redemption is completed, cancelled, or rejected
  const activeForms = (forms || []).filter((form) => {
    if (!form) return false;
    if (form.status === 'completed' || form.status === 'cancelled' || form.status === 'rejected') return false;
    if (form.redemption_requests?.status === 'completed' || form.redemption_requests?.status === 'cancelled' || form.redemption_requests?.status === 'rejected') return false;
    if (form.redemption_requests &&
        Number(form.redemption_requests.amount || 0) > 0 &&
        Number(form.redemption_requests.already_redeemed_so_far || 0) >= Number(form.redemption_requests.amount || 0)) {
      return false;
    }
    return true;
  });

  if (!activeForms || activeForms.length === 0) return null;

  return (
    <>
      <div className="space-y-3 mb-4 shrink-0">
        {activeForms.map((form) => {
          const isWithdrawer = form.role === 'withdrawing_member';
          const isParticipant = form.role === 'participating_member';
          const isPage1Submitted = Boolean(form.page1_data?.submittedAt);
          const hasConsented = Boolean(form.userConsent?.has_consented);
          const daysRemaining = form.daysRemaining ?? 30;
          const isExpired = form.isExpired;
          const withdrawingMemberName =
            form.shareholders?.fullName ||
            form.page1_data?.fullLegalName ||
            form.page1_data?.printedName ||
            'A participating member';

          return (
            <div
              key={form.id}
              className={`rounded-2xl p-4 sm:p-5 border shadow-sm transition-all relative overflow-hidden ${
                isExpired
                  ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                  : hasConsented
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                    : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50/80 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-amber-200 dark:border-amber-800/80'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left Information */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      isExpired
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300'
                        : hasConsented
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                    }`}
                  >
                    {hasConsented ? (
                      <CheckCircleIcon className="h-6 w-6" />
                    ) : (
                      <ExclamationTriangleIcon className="h-6 w-6" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                        {isWithdrawer
                          ? 'Action Required: Member Redemption Form'
                          : !isPage1Submitted
                            ? `Notice of Withdrawal: ${withdrawingMemberName} (USA Land Project)`
                            : hasConsented
                              ? `Written Consent Recorded: Withdrawal of ${withdrawingMemberName}`
                              : `Written Consent Required: Withdrawal of ${withdrawingMemberName}`}
                      </h4>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider font-mono ${
                          isExpired
                            ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
                            : 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200'
                        }`}
                      >
                        <ClockIcon className="h-3 w-3" />
                        {isExpired ? 'Notice Window Expired' : `${daysRemaining} Days Left`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {isWithdrawer
                        ? isPage1Submitted
                          ? 'Your withdrawal documentation has been submitted. Awaiting unanimous member consents and administrative sign-off.'
                          : 'The redemption process has been initiated for your USA Land Project investment. Please complete Page 1 of the official form within the 30-day notice window.'
                        : !isPage1Submitted
                          ? `${withdrawingMemberName} has initiated a withdrawal notice from the USA Land Project. Under Section 5.1, the 30-day notice window is active. Review and written consents will open upon submission of their exit terms.`
                          : hasConsented
                            ? `You have formally recorded your written consent and ROFR waiver for the withdrawal of ${withdrawingMemberName} on ${new Date(
                                form.userConsent.signed_at
                              ).toLocaleDateString()}.`
                            : `${withdrawingMemberName} has submitted their withdrawal documentation from the USA Land Project. Under Section 5.2, your written consent and ROFR waiver are required.`}
                    </p>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedForm(form)}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-center"
                  >
                    <DocumentTextIcon className="h-4 w-4 shrink-0" />
                    <span>
                      {isWithdrawer
                        ? 'MEMBER WITHDRAWAL & INTEREST DISPOSITION FORM'
                        : !isPage1Submitted
                          ? 'VIEW WITHDRAWAL NOTICE & DETAILS'
                          : hasConsented
                            ? 'VIEW WITHDRAWAL DOCUMENTATION'
                            : 'MEMBER WITHDRAWAL & INTEREST DISPOSITION FORM'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedForm && (
        <MemberWithdrawalModal
          form={selectedForm}
          currentShareholderId={shareholderId}
          onClose={() => setSelectedForm(null)}
          onSuccess={() => {
            // refresh page
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
