'use client';

import React, { useState } from 'react';
import {
  XMarkIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ContractConstructModal from './ContractConstructModal';
import AdminOverrideConfirmModal from './AdminOverrideConfirmModal';
import {
  submitWithdrawingMemberPage1,
  submitParticipatingMemberConsent,
  adminOverrideMemberConsent,
  submitAdminPart6Approval,
} from '@/app/_lib/withdrawal-form-actions';

export default function MemberWithdrawalModal({
  form,
  currentShareholderId,
  isAdmin = false,
  onClose,
  onSuccess,
}) {
  if (!form) return null;

  // Determine roles strictly
  const isWithdrawingMember = form.role === 'withdrawing_member' && !isAdmin;
  const isParticipatingMember = form.role === 'participating_member' && !isAdmin;

  // Withdrawing member identification
  const page1 = form.page1_data || {};
  const withdrawingMemberName =
    page1.fullLegalName ||
    form.shareholders?.fullName ||
    page1.printedName ||
    'Withdrawing Member';

  const isInitialPage1Submitted = Boolean(form.page1_data?.submittedAt);
  // Withdrawing member is locked to Page 1. Participating member defaults to Page 2 if submitted, else Page 1 review. Admin can view both.
  const [activePage, setActivePage] = useState(
    isParticipatingMember ? (isInitialPage1Submitted ? 2 : 1) : 1
  );
  const [showContractConstruct, setShowContractConstruct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);

  // Consents state (local copy for instant UI updates on Admin Override / Consent submission)
  const [consents, setConsents] = useState(
    Array.isArray(form.consents) ? form.consents : []
  );

  // Page 1 state
  const [fullLegalName, setFullLegalName] = useState(page1.fullLegalName || '');
  const [effectiveExitDate, setEffectiveExitDate] = useState(
    page1.effectiveExitDate || ''
  );
  const [reasonForWithdrawal, setReasonForWithdrawal] = useState(
    page1.reasonForWithdrawal || ''
  );
  const [dispositionOption, setDispositionOption] = useState(
    page1.dispositionOption || 'option_b'
  );
  const [purchaserNames, setPurchaserNames] = useState(
    page1.optionA?.purchaserNames || ''
  );
  const [agreedPriceA, setAgreedPriceA] = useState(
    page1.optionA?.agreedPrice || ''
  );

  // Valuation for Option B: strictly read-only official valuation
  const valuationDisplay =
    page1.optionB?.agreedRedemptionAmount ||
    (form.redemption_requests?.amount
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(form.redemption_requests.amount)
      : '$1,000.00');

  const [transfereeName, setTransfereeName] = useState(
    page1.optionC?.transfereeName || ''
  );
  const [transferPriceC, setTransferPriceC] = useState(
    page1.optionC?.transferPrice || ''
  );
  const [termsAcknowledged, setTermsAcknowledged] = useState(
    Boolean(page1.termsAcknowledged)
  );
  const [memberSignature, setMemberSignature] = useState(
    page1.memberSignature || ''
  );
  const [printedName, setPrintedName] = useState(
    page1.printedName || page1.fullLegalName || ''
  );
  const [phoneEmail, setPhoneEmail] = useState(page1.phoneEmail || '');

  // Page 2 / Part 5 state for participating member
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [participantSignature, setParticipantSignature] = useState('');

  // Part 6 Admin Signatures state
  const [part6PmSig, setPart6PmSig] = useState(
    form.part6_admin?.pmSignature || 'Jephline Okoth'
  );
  const [part6OfficerSig, setPart6OfficerSig] = useState(
    form.part6_admin?.officerSignature || 'Daniel Obiero'
  );
  const [part6Completed, setPart6Completed] = useState(
    Boolean(form.part6_admin?.isCompleted)
  );

  const isPage1Submitted = Boolean(page1.submittedAt);
  const isExpired = form.isExpired;
  const daysRemaining = form.daysRemaining ?? 30;

  // Participating member single-consent matching
  const myConsent = consents.find(
    (c) =>
      (currentShareholderId && Number(c.shareholder_id) === Number(currentShareholderId)) ||
      (form.userConsent?.shareholder_id && Number(c.shareholder_id) === Number(form.userConsent.shareholder_id)) ||
      (form.userConsent?.email && c.email && c.email.toLowerCase() === form.userConsent.email.toLowerCase()) ||
      (c.member_name && form.userConsent?.member_name && c.member_name.toLowerCase() === form.userConsent.member_name.toLowerCase())
  ) || form.userConsent;

  // Handle Page 1 Submission (Withdrawing Member Only)
  const handleSubmitPage1 = async (e) => {
    e.preventDefault();
    if (!termsAcknowledged) {
      toast.error('Please acknowledge the terms, settlement, and release.');
      return;
    }
    if (!memberSignature.trim()) {
      toast.error('Digital signature is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const fd = new FormData();
      fd.append('formId', form.id);
      fd.append('fullLegalName', fullLegalName);
      fd.append('capitalContributed', page1.capitalContributed || valuationDisplay || '$1,000.00');
      fd.append('projectInterest', page1.projectInterest || '12.50% (1/8 share)');
      fd.append('noticeDate', page1.noticeDate || new Date().toISOString().split('T')[0]);
      fd.append('effectiveExitDate', effectiveExitDate);
      fd.append('reasonForWithdrawal', reasonForWithdrawal);
      fd.append('dispositionOption', dispositionOption);
      fd.append('purchaserNames', purchaserNames);
      fd.append('agreedPriceA', agreedPriceA);
      fd.append('agreedRedemptionAmount', valuationDisplay);
      fd.append('transfereeName', transfereeName);
      fd.append('transferPriceC', transferPriceC);
      fd.append('termsAcknowledged', 'true');
      fd.append('memberSignature', memberSignature.trim());
      fd.append('printedName', printedName.trim());
      fd.append('phoneEmail', phoneEmail.trim());

      await submitWithdrawingMemberPage1(fd);
      toast.success('Withdrawal form submitted successfully.');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit withdrawal form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Part 5 Consent Submission (Participating Member Only)
  const handleConsentSubmit = async (e) => {
    e.preventDefault();
    if (!consentAgreed) {
      toast.error('Please check the box to confirm your consent.');
      return;
    }
    if (!participantSignature.trim()) {
      toast.error('Please type your digital signature.');
      return;
    }

    try {
      setIsSubmitting(true);
      await submitParticipatingMemberConsent({
        formId: form.id,
        signature: participantSignature.trim(),
      });
      toast.success('Your consent and waiver have been recorded.');

      // Update local consents
      setConsents((prev) =>
        prev.map((c) => {
          const isMe =
            (currentShareholderId && Number(c.shareholder_id) === Number(currentShareholderId)) ||
            (form.userConsent?.shareholder_id && Number(c.shareholder_id) === Number(form.userConsent.shareholder_id)) ||
            (form.userConsent?.email && c.email && c.email.toLowerCase() === form.userConsent.email.toLowerCase()) ||
            (c.member_name && form.userConsent?.member_name && c.member_name.toLowerCase() === form.userConsent.member_name.toLowerCase());
          if (isMe) {
            return {
              ...c,
              has_consented: true,
              signature: participantSignature.trim(),
              signed_at: new Date().toISOString(),
            };
          }
          return c;
        })
      );

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to submit consent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Admin Override for a single shareholder (Opens Confirmation Modal)
  const handleAdminOverride = (member) => {
    setOverrideTarget({ member, isBulk: false });
  };

  // Handle Admin Override for all pending shareholders (Opens Confirmation Modal)
  const handleAdminOverrideAll = () => {
    const pendingList = consents.filter((c) => !c.has_consented);
    setOverrideTarget({ isBulk: true, pendingCount: pendingList.length });
  };

  // Confirmed execution of Admin Override
  const handleConfirmAdminOverride = async () => {
    if (!overrideTarget) return;
    const { member, isBulk } = overrideTarget;

    try {
      setIsSubmitting(true);
      if (isBulk) {
        await adminOverrideMemberConsent({
          formId: form.id,
          overrideAll: true,
          reason: 'Admin Override - Process completed to unlock flow',
        });
        toast.success('All pending member consents recorded as Admin Override.');

        setConsents((prev) =>
          prev.map((c) => ({
            ...c,
            has_consented: true,
            signature: c.has_consented ? c.signature : 'Admin Override',
            is_admin_override: c.has_consented ? c.is_admin_override : true,
            signed_at: c.signed_at || new Date().toISOString(),
          }))
        );
      } else {
        await adminOverrideMemberConsent({
          formId: form.id,
          shareholderId: member.shareholder_id || member.member_name,
          reason: 'Admin Override - Process completed to unlock flow',
        });
        toast.success(`Consent recorded as Admin Override for ${member.member_name}.`);

        setConsents((prev) =>
          prev.map((c) => {
            const isTarget =
              (member.shareholder_id && Number(c.shareholder_id) === Number(member.shareholder_id)) ||
              (c.member_name === member.member_name);
            if (isTarget) {
              return {
                ...c,
                has_consented: true,
                signature: 'Admin Override',
                is_admin_override: true,
                signed_at: new Date().toISOString(),
              };
            }
            return c;
          })
        );
      }
      setOverrideTarget(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to record Admin Override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Admin Part 6 Approval submission
  const handleAdminPart6Submit = async (e) => {
    e.preventDefault();
    if (!part6PmSig.trim() || !part6OfficerSig.trim()) {
      toast.error('Both Project Manager and Authorized Company Officer signatures are required.');
      return;
    }
    try {
      setIsSubmitting(true);
      await submitAdminPart6Approval({
        formId: form.id,
        pmSignature: part6PmSig.trim(),
        officerSignature: part6OfficerSig.trim(),
      });
      toast.success('Administrative approval recorded successfully.');
      setPart6Completed(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to record administrative approval.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingConsentsCount = consents.filter((c) => !c.has_consented).length;

  return (
    <>
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* TOP BAR / EXPIRATION COUNTDOWN WARNING */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-blue-900/50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <ClockIcon className="h-3.5 w-3.5" />
                {isExpired ? 'EXPIRED' : `${daysRemaining} Days Left`}
              </span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                30-Day Notice Period active pursuant to Section 5.1
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowContractConstruct(true)}
                className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white bg-blue-900/40 hover:bg-blue-900/70 border border-blue-700/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <ScaleIcon className="h-3.5 w-3.5 text-blue-400" />
                <span>Contract Construct Reference</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close form"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* PAGE NAVIGATION TABS */}
          <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {/* Withdrawing member sees only Page 1 tab */}
              {isWithdrawingMember ? (
                <div className="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black tracking-wide bg-blue-600 text-white shadow-sm">
                  Page 1 of 1: Withdrawing Member Form
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePage(1)}
                    className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                      activePage === 1
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isAdmin
                      ? 'Page 1 of 2: Withdrawing Member Form (Review)'
                      : 'Page 1 of 2: Withdrawing Member Details (Read Only)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePage(2)}
                    className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                      activePage === 2
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isAdmin
                      ? 'Page 2 of 2: Consents & Administrative Approval'
                      : 'Page 2 of 2: Your Written Consent'}
                  </button>
                </>
              )}
            </div>

            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
              Form ID: #{String(form.id).slice(0, 8)}
            </span>
          </div>

          {/* SCROLLABLE FORM BODY */}
          <div className="p-4 sm:p-8 overflow-y-auto space-y-6">
            {/* OFFICIAL DOCUMENT HEADER */}
            <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    WINAM
                  </h1>
                  <p className="text-xs font-serif italic text-blue-600 dark:text-blue-400 font-bold">
                    Stronger Together
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 font-sans">
                  <p className="font-bold text-slate-700 dark:text-slate-200">
                    WINAM DEVELOPMENT GROUP, LLC
                  </p>
                  <p>A Texas Limited Liability Company</p>
                  <p>P.O. Box 690887, Houston, Texas 77269</p>
                  <p className="text-blue-600 dark:text-blue-400 font-mono">
                    winamdevelopment@gmail.com
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-wide uppercase text-center">
                  MEMBER WITHDRAWAL & INTEREST DISPOSITION FORM
                </h2>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Winam USA Land Purchase Project • Special Project Agreement
                </p>
              </div>

              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                This Member Withdrawal & Interest Disposition Form is executed pursuant to <strong>Section 5 (Term and Withdrawal)</strong> and <strong>Section 6</strong> of the Project Participation Agreement effective March 1, 2026, for the <strong>WINAM USA LAND PURCHASE PROJECT</strong>, a designated Special Project of Winam Development Group, LLC.
              </p>

              {/* NOTICE QUOTE CALLOUT */}
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                <strong>Notice of Contractual Requirement (Section 5.2 & 5.3):</strong> "No Participating Member may withdraw or transfer their interest without prior written consent of all others. If a Member wishes to transfer their interest, the remaining Members shall have the right of first refusal on the same terms."
              </div>
            </div>

            {/* PAGE 1 CONTENT */}
            {activePage === 1 && (
              <form onSubmit={handleSubmitPage1} className="space-y-6">
                {!isWithdrawingMember && (
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>
                      <strong>Review Mode (Read Only):</strong> Viewing submitted withdrawal details for {page1.fullLegalName || form.shareholders?.fullName || 'Withdrawing Member'}.
                    </span>
                  </div>
                )}

                {/* 1. WITHDRAWING MEMBER INFORMATION */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900 shadow-2xs">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white border-b pb-2 flex items-center justify-between">
                    <span>1. Withdrawing Member Information</span>
                    {isPage1Submitted && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Submitted
                      </span>
                    )}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Full Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isPage1Submitted || !isWithdrawingMember}
                        value={fullLegalName}
                        onChange={(e) => setFullLegalName(e.target.value)}
                        placeholder="e.g. Carolyne Opondo"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-75"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Capital Contributed
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={page1.capitalContributed || valuationDisplay || '$1,000.00'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 font-mono text-slate-700 dark:text-slate-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                          Project Interest
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={page1.projectInterest || '12.50% (1/8 share)'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 font-mono text-slate-700 dark:text-slate-300 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Notice Date
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={page1.noticeDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 font-mono text-slate-700 dark:text-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Effective Exit Date *
                      </label>
                      <input
                        type="date"
                        required
                        disabled={isPage1Submitted || !isWithdrawingMember}
                        value={effectiveExitDate}
                        onChange={(e) => setEffectiveExitDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-75"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Reason for Withdrawal *
                      </label>
                      <textarea
                        required
                        rows="2"
                        disabled={isPage1Submitted || !isWithdrawingMember}
                        value={reasonForWithdrawal}
                        onChange={(e) => setReasonForWithdrawal(e.target.value)}
                        placeholder="State the formal basis or circumstances for withdrawal..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:opacity-75"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. METHOD OF INTEREST DISPOSITION */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      2. Method of Interest Disposition
                    </h3>
                    {!isWithdrawingMember && (
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        Withdrawing Member: <strong className="font-bold">{withdrawingMemberName}</strong>
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* OPTION A */}
                    <div
                      className={`p-3.5 rounded-xl border transition-all ${
                        dispositionOption === 'option_a'
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="dispositionOption"
                          value="option_a"
                          disabled={isPage1Submitted || !isWithdrawingMember}
                          checked={dispositionOption === 'option_a'}
                          onChange={() => setDispositionOption('option_a')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="space-y-1 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white">
                            Option A: Buyout by Remaining Participating Member(s)
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            Exercise of Right of First Refusal under Section 5.3.
                          </p>
                          {dispositionOption === 'option_a' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              <input
                                type="text"
                                placeholder="Purchaser Name(s)"
                                disabled={isPage1Submitted || !isWithdrawingMember}
                                value={purchaserNames}
                                onChange={(e) => setPurchaserNames(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Agreed Price ($)"
                                disabled={isPage1Submitted || !isWithdrawingMember}
                                value={agreedPriceA}
                                onChange={(e) => setAgreedPriceA(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* OPTION B - AGREED REDEMPTION AMOUNT READ-ONLY VALUATION */}
                    <div
                      className={`p-3.5 rounded-xl border transition-all ${
                        dispositionOption === 'option_b'
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="dispositionOption"
                          value="option_b"
                          disabled={isPage1Submitted || !isWithdrawingMember}
                          checked={dispositionOption === 'option_b'}
                          onChange={() => setDispositionOption('option_b')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="space-y-1 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white">
                            Option B: Redemption / Buyback by Winam Development Group, LLC
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            Company acquires and holds/retires the {page1.projectInterest || '12.50%'} interest of {withdrawingMemberName} for an agreed redemption amount.
                          </p>
                          {dispositionOption === 'option_b' && (
                            <div className="pt-2 max-w-xs space-y-1">
                              <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                                <span>Agreed Redemption Amount</span>
                                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold lowercase tracking-normal">
                                  (valuation • read only)
                                </span>
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={valuationDisplay}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 font-mono text-xs font-black text-blue-700 dark:text-blue-400 select-none cursor-not-allowed"
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* OPTION C */}
                    <div
                      className={`p-3.5 rounded-xl border transition-all ${
                        dispositionOption === 'option_c'
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="radio"
                          name="dispositionOption"
                          value="option_c"
                          disabled={isPage1Submitted || !isWithdrawingMember}
                          checked={dispositionOption === 'option_c'}
                          onChange={() => setDispositionOption('option_c')}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="space-y-1 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white">
                            Option C: Transfer to Approved New Member / Third Party
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            Subject to unanimous written consent of all remaining Participating Members.
                          </p>
                          {dispositionOption === 'option_c' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                              <input
                                type="text"
                                placeholder="Transferee Legal Name"
                                disabled={isPage1Submitted || !isWithdrawingMember}
                                value={transfereeName}
                                onChange={(e) => setTransfereeName(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Transfer Price ($)"
                                disabled={isPage1Submitted || !isWithdrawingMember}
                                value={transferPriceC}
                                onChange={(e) => setTransferPriceC(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. TERMS, SETTLEMENT & MUTUAL RELEASE */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 bg-white dark:bg-slate-900 shadow-2xs">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white border-b pb-2">
                    3. Terms, Settlement & Mutual Release
                  </h3>

                  <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    <li>
                      <strong>Surrender of Rights:</strong> Effective upon full payment of the agreed settlement amount, the Withdrawing Member relinquishes all rights, title, voting privileges, and claims to allocations and distributions under Sections 3 and 4 of the Participation Agreement.
                    </li>
                    <li>
                      <strong>Accounting & Settlement:</strong> The designated Project Account shall disburse funds according to Section 4.3 upon formal verification of accounts by the Finance Officer and Project Manager.
                    </li>
                    <li>
                      <strong>Full & Final Release:</strong> The Withdrawing Member releases Winam Development Group, LLC, its officers, managers, and remaining Participating Members from any and all future liabilities, debts, obligations, or claims relating to the Project, subject to Section 7 (Indemnification).
                    </li>
                  </ol>

                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        disabled={isPage1Submitted || !isWithdrawingMember}
                        checked={termsAcknowledged}
                        onChange={(e) => setTermsAcknowledged(e.target.checked)}
                        className="mt-0.5 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        I hereby acknowledge, accept, and agree to the Terms, Settlement & Mutual Release clauses in full.
                      </span>
                    </label>
                  </div>
                </div>

                {/* 4. WITHDRAWING MEMBER ACKNOWLEDGMENT & SIGNATURE */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900 shadow-2xs">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white border-b pb-2">
                    4. Withdrawing Member Acknowledgment & Signature
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                    "I hereby submit my formal withdrawal and confirm my request to transfer/relinquish my 12.50% interest in the Winam USA Land Purchase Project under the terms outlined herein."
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Member Digital Signature *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={isPage1Submitted || !isWithdrawingMember}
                        value={memberSignature}
                        onChange={(e) => setMemberSignature(e.target.value)}
                        placeholder="Type full legal name as digital signature"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-900 dark:text-blue-300 font-serif italic text-base focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Date Signed (System Timestamp)
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={
                          page1.dateSigned
                            ? new Date(page1.dateSigned).toLocaleString()
                            : new Date().toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 font-mono text-slate-700 dark:text-slate-300 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Printed Name
                      </label>
                      <input
                        type="text"
                        disabled={isPage1Submitted || !isWithdrawingMember}
                        value={printedName}
                        onChange={(e) => setPrintedName(e.target.value)}
                        placeholder="Printed Legal Name"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                        Phone / Email
                      </label>
                      <input
                        type="text"
                        disabled={isPage1Submitted || !isWithdrawingMember}
                        value={phoneEmail}
                        onChange={(e) => setPhoneEmail(e.target.value)}
                        placeholder="Contact Phone or Email"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs disabled:opacity-75"
                      />
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTONS FOR PAGE 1 */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {isWithdrawingMember ? 'Page 1 of 1' : 'Page 1 of 2'}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Withdrawing member stops here, submits and closes. No view of Page 2. */}
                    {isWithdrawingMember && (
                      <>
                        {isPage1Submitted ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Form Submitted on {new Date(page1.submittedAt || Date.now()).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <button
                            type="submit"
                            disabled={isSubmitting || isExpired}
                            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                          >
                            {isSubmitting ? 'Submitting Form...' : 'Submit Withdrawal Form'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Close
                        </button>
                      </>
                    )}

                    {/* Non-withdrawing members (Admin & Participating members) can advance to Page 2 */}
                    {!isWithdrawingMember && (
                      <button
                        type="button"
                        onClick={() => setActivePage(2)}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <span>{isAdmin ? 'View Page 2: Consents & Approval' : 'Proceed to Page 2: Your Written Consent'}</span>
                        <span>&rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            )}

            {/* PAGE 2 CONTENT (VIEWABLE ONLY BY ADMIN AND PARTICIPATING MEMBERS) */}
            {activePage === 2 && !isWithdrawingMember && (
              <div className="space-y-6">
                {/* WITHDRAWING MEMBER IDENTIFICATION NOTICE (INFORMS PARTICIPATING SHAREHOLDERS) */}
                <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 dark:border-blue-900/60 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0">
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-black tracking-widest text-blue-600 dark:text-blue-400">
                            Withdrawing Shareholder Notice
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/70 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                            USA Land Project
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {withdrawingMemberName}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                        Project Interest: {page1.projectInterest || '12.50% (1/8 share)'}
                      </span>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-2xs">
                        Agreed Valuation: {valuationDisplay}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans space-y-1">
                    <p>
                      Shareholder <strong className="text-slate-900 dark:text-white">{withdrawingMemberName}</strong> has delivered formal notice to withdraw from the <strong>USA Land Project</strong>. 
                      Pursuant to <strong>Section 5.2 (Term & Withdrawal)</strong> and <strong>Section 5.3 (Right of First Refusal)</strong> of the Project Participation Agreement, 
                      the unanimous written consent of all remaining participating co-investors is required to formalize and execute this withdrawal and interest disposition.
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300">Selected Disposition:</strong>{' '}
                        {page1.dispositionOption === 'option_a'
                          ? `Option A: Buyout by Remaining Participating Member(s)`
                          : page1.dispositionOption === 'option_c'
                          ? `Option C: Transfer to Approved New Member`
                          : `Option B: Company Redemption / Buyback (${valuationDisplay})`}
                      </span>
                      {page1.noticeDate && (
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">Notice Date:</strong> {page1.noticeDate}
                        </span>
                      )}
                      {page1.effectiveExitDate && (
                        <span>
                          <strong className="text-slate-700 dark:text-slate-300">Target Exit Date:</strong> {page1.effectiveExitDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. PARTICIPATING MEMBERS' WRITTEN CONSENT */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {isAdmin
                          ? "5. Participating Members' Written Consent (Section 5.2 Protocol)"
                          : `5. Your Written Consent for Withdrawal of ${withdrawingMemberName}`}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 italic leading-relaxed">
                        "By signing below, the undersigned Participating Member waives Right of First Refusal (if applicable) and gives unanimous written consent to this withdrawal and interest disposition."
                      </p>
                    </div>

                    {/* Admin Override All button */}
                    {isAdmin && pendingConsentsCount > 0 && (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleAdminOverrideAll}
                        className="shrink-0 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                      >
                        Admin Override All Pending ({pendingConsentsCount})
                      </button>
                    )}
                  </div>

                  {/* ADMIN VIEW: FULL ROSTER TABLE OF ALL MEMBERS WITH ADMIN OVERRIDE BUTTONS */}
                  {isAdmin && (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Member Name</th>
                            <th className="py-2.5 px-3">Signature</th>
                            <th className="py-2.5 px-3">Decision</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3 text-right">Admin Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {consents.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-4 text-center text-slate-400 italic">
                                No participating members loaded.
                              </td>
                            </tr>
                          ) : (
                            consents.map((member, idx) => {
                              const isOverridden = Boolean(member.is_admin_override || member.signature === 'Admin Override');
                              return (
                                <tr
                                  key={member.shareholder_id || idx}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                                    {member.member_name}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {member.has_consented ? (
                                      isOverridden ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-mono">
                                          Admin Override
                                        </span>
                                      ) : (
                                        <span className="font-serif italic text-blue-900 dark:text-blue-300 text-sm">
                                          {member.signature}
                                        </span>
                                      )
                                    ) : (
                                      <span className="text-slate-400 italic">[ Pending Signature ]</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    {member.has_consented ? (
                                      <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                                        isOverridden
                                          ? 'text-purple-700 dark:text-purple-300'
                                          : 'text-emerald-600 dark:text-emerald-400'
                                      }`}>
                                        <CheckCircleIcon className="h-4 w-4" />
                                        {isOverridden ? '[✓] Consent (Admin Override)' : '[✓] Consent'}
                                      </span>
                                    ) : (
                                      <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">
                                        ⏳ Awaiting Consent
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                    {member.signed_at
                                      ? new Date(member.signed_at).toLocaleDateString()
                                      : '—'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    {!member.has_consented ? (
                                      <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => handleAdminOverride(member)}
                                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider shadow-2xs transition-all cursor-pointer"
                                      >
                                        Admin Override
                                      </button>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 italic">
                                        {isOverridden ? 'Overridden' : 'Completed'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* PARTICIPATING MEMBER VIEW: ONLY THEIR OWN PERSONAL CONSENT CARD (DO NOT SHOW ROSTER OF OTHERS) */}
                  {!isAdmin && myConsent && (
                    <div className="space-y-4">
                      {!isPage1Submitted ? (
                        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                            <ClockIcon className="h-5 w-5 text-amber-600 shrink-0" />
                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                              Notice Active • Awaiting Withdrawing Member Submission
                            </h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                            Shareholder <strong className="text-slate-900 dark:text-white">{withdrawingMemberName}</strong> has delivered formal notice to withdraw from the USA Land Project. Under Section 5.1, the 30-day notice window is active. You may review Page 1 notice details in read-only mode. Written consent execution will unlock once Page 1 exit details are submitted.
                          </p>
                        </div>
                      ) : myConsent.has_consented ? (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                            <CheckCircleIcon className="h-5 w-5 text-emerald-600 shrink-0" />
                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                              Written Consent Recorded: Withdrawal of {withdrawingMemberName}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                              <span className="block text-[10px] uppercase font-bold text-slate-400">
                                Consenting Member
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">
                                {myConsent.member_name}
                              </span>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                              <span className="block text-[10px] uppercase font-bold text-slate-400">
                                Digital Signature
                              </span>
                              <span className="font-serif italic text-blue-900 dark:text-blue-300 font-bold text-sm">
                                {myConsent.signature || 'Digital Signature Recorded'}
                              </span>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                              <span className="block text-[10px] uppercase font-bold text-slate-400">
                                Date Signed (System Date)
                              </span>
                              <span className="font-mono text-slate-700 dark:text-slate-300">
                                {myConsent.signed_at
                                  ? new Date(myConsent.signed_at).toLocaleDateString()
                                  : new Date().toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic pt-1">
                            Thank you. Your consent for {withdrawingMemberName}&apos;s withdrawal has been recorded under Section 5.2 of the Winam USA Land Project Participation Agreement.
                          </p>
                        </div>
                      ) : (
                        <form
                          onSubmit={handleConsentSubmit}
                          className="p-4 sm:p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-4"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-blue-950 dark:text-blue-200">
                              Action Required: Sign Written Consent for the Withdrawal of {withdrawingMemberName}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              As a participating member in the USA Land Project, your formal approval and waiver of Right of First Refusal (ROFR) are required for <strong>{withdrawingMemberName}</strong>&apos;s withdrawal request.
                            </p>
                          </div>

                          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-blue-100 dark:border-blue-900/60">
                            <span className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                              Participating Member Name (You)
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {myConsent.member_name}
                            </span>
                          </div>

                          <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              required
                              checked={consentAgreed}
                              onChange={(e) => setConsentAgreed(e.target.checked)}
                              className="mt-0.5 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              [✓] I hereby give unanimous written consent to the withdrawal and interest disposition of <u>{withdrawingMemberName}</u>, and waive Right of First Refusal under Section 5.3.
                            </span>
                          </label>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                                Digital Signature (Type full legal name) *
                              </label>
                              <input
                                type="text"
                                required
                                value={participantSignature}
                                onChange={(e) => setParticipantSignature(e.target.value)}
                                placeholder={myConsent.member_name}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-serif italic text-base text-blue-900 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase mb-1">
                                Date Signed (System Date)
                              </label>
                              <input
                                type="text"
                                readOnly
                                value={new Date().toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300 text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              type="submit"
                              disabled={isSubmitting || !consentAgreed || !participantSignature.trim()}
                              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                            >
                              {isSubmitting ? 'Recording Consent...' : 'Submit Written Consent'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                {/* 6. COMPANY ADMINISTRATIVE APPROVAL (STRICTLY ADMIN ONLY) */}
                {isAdmin && (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        6. Company Administrative Approval
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          part6Completed
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {part6Completed ? '✓ Completed & Verified' : 'Pending Administrative Signatures'}
                      </span>
                    </div>

                    {part6Completed ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* PM APPROVAL */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                          <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                            PROJECT MANAGER APPROVAL (SEC. 3.1)
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 font-medium">
                            Jephline Okoth, Project Manager
                          </p>
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Signature:</p>
                            <p className="font-serif italic text-base text-blue-900 dark:text-blue-300 mt-0.5">
                              {form.part6_admin?.pmSignature || part6PmSig || 'Jephline Okoth'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Date:</p>
                            <p className="font-mono text-xs text-slate-600 dark:text-slate-300">
                              {form.part6_admin?.pmSignedAt
                                ? new Date(form.part6_admin.pmSignedAt).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* OFFICER APPROVAL */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                          <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                            AUTHORIZED COMPANY OFFICER APPROVAL
                          </p>
                          <p className="text-slate-600 dark:text-slate-400 font-medium">
                            Daniel Obiero / Authorized Officer, Winam Development Group, LLC
                          </p>
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Signature:</p>
                            <p className="font-serif italic text-base text-blue-900 dark:text-blue-300 mt-0.5">
                              {form.part6_admin?.officerSignature || part6OfficerSig || 'Daniel Obiero'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Date:</p>
                            <p className="font-mono text-xs text-slate-600 dark:text-slate-300">
                              {form.part6_admin?.officerSignedAt
                                ? new Date(form.part6_admin.officerSignedAt).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleAdminPart6Submit} className="space-y-4 text-xs">
                        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                          Before this redemption can be finalized, administrative sign-off must be completed pursuant to Section 3.1 & Section 4.3:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              Project Manager (Jephline Okoth) Signature *
                            </label>
                            <input
                              type="text"
                              required
                              value={part6PmSig}
                              onChange={(e) => setPart6PmSig(e.target.value)}
                              placeholder="Type 'Jephline Okoth' as signature"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-serif italic text-sm text-blue-900 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase">
                              Authorized Officer (Daniel Obiero) Signature *
                            </label>
                            <input
                              type="text"
                              required
                              value={part6OfficerSig}
                              onChange={(e) => setPart6OfficerSig(e.target.value)}
                              placeholder="Type 'Daniel Obiero' as signature"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-serif italic text-sm text-blue-900 dark:text-blue-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={isSubmitting || !part6PmSig.trim() || !part6OfficerSig.trim()}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                          >
                            {isSubmitting ? 'Recording Approval...' : 'Save & Approve Part 6'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* BOTTOM CONTROLS FOR PAGE 2 */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActivePage(1)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    &larr; Back to Page 1
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">Page 2 of 2</span>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONTRACT CONSTRUCT MODAL */}
      <ContractConstructModal
        isOpen={showContractConstruct}
        onClose={() => setShowContractConstruct(false)}
      />

      {/* ADMIN OVERRIDE CONFIRMATION MODAL */}
      <AdminOverrideConfirmModal
        isOpen={Boolean(overrideTarget)}
        targetMember={overrideTarget?.member}
        isBulk={Boolean(overrideTarget?.isBulk)}
        pendingCount={overrideTarget?.pendingCount || pendingConsentsCount}
        isSubmitting={isSubmitting}
        onClose={() => setOverrideTarget(null)}
        onConfirm={handleConfirmAdminOverride}
      />
    </>
  );
}
