'use client';

import { useState, useEffect } from 'react';
import { savePaymentMethod } from '@/app/_lib/actions';
import { useToast } from '@/app/_lib/ToastContext';
import { formatClientError } from '@/app/_lib/client-error-handler';
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  XMarkIcon,
  ReceiptPercentIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import ShareholderLedgerModal from '@/app/_components/ShareholderLedgerModal';

function SubmitButton({ isSubmitting, showSuccess, hasError }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={`w-full sm:w-auto px-6 py-3 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
        isSubmitting
          ? 'bg-blue-600 text-white'
          : showSuccess
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-500/20'
          : hasError
          ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25 ring-2 ring-rose-500/20'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
      }`}
    >
      {isSubmitting ? (
        <>
          <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Saving...</span>
        </>
      ) : showSuccess ? (
        <>
          <CheckCircleIcon className="h-4 w-4 text-white animate-in zoom-in-75 duration-200" />
          <span>Saved!</span>
        </>
      ) : hasError ? (
        <>
          <ExclamationCircleIcon className="h-4 w-4 text-white animate-in zoom-in-75 duration-200" />
          <span>Retry Save</span>
        </>
      ) : (
        <>
          <SparklesIcon className="h-3.5 w-3.5 text-blue-200" />
          <span>Save Information</span>
        </>
      )}
    </button>
  );
}

export default function PaymentForm({ paymentMethod, user }) {
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  const initialType = paymentMethod?.payment_type || 'zelle';
  const [selectedType, setSelectedType] = useState(initialType);
  const [accountNumber, setAccountNumber] = useState(
    paymentMethod?.account_number || ''
  );
  const [accountHandle, setAccountHandle] = useState(
    paymentMethod?.account_handle || ''
  );
  const [accountName, setAccountName] = useState(
    paymentMethod?.account_name || user?.fullName || ''
  );

  // Sync state when paymentMethod updates after server action revalidation
  useEffect(() => {
    if (paymentMethod) {
      if (paymentMethod.payment_type) setSelectedType(paymentMethod.payment_type);
      if (paymentMethod.account_number) setAccountNumber(paymentMethod.account_number);
      if (paymentMethod.account_handle) setAccountHandle(paymentMethod.account_handle);
      if (paymentMethod.account_name) setAccountName(paymentMethod.account_name);
    }
  }, [paymentMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!accountName.trim()) {
      const msg = 'Account name is required.';
      setErrorMessage(msg);
      showToast?.(msg, 'error');
      return;
    }

    if (accountNumber && !/^\d+$/.test(accountNumber.trim())) {
      const msg = 'Account number must contain only numeric digits.';
      setErrorMessage(msg);
      showToast?.(msg, 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setShowSuccess(false);

    try {
      const formData = new FormData();
      formData.append('paymentType', selectedType);
      formData.append('accountName', accountName.trim());
      formData.append('accountHandle', accountHandle.trim());
      formData.append('accountNumber', accountNumber.trim());

      const res = await savePaymentMethod(null, formData);

      if (res?.success) {
        setShowSuccess(true);
        showToast?.(res.message || 'Payment information saved successfully!', 'success');
        setTimeout(() => {
          setShowSuccess(false);
        }, 4000);
      } else {
        const errorMsg = formatClientError(res?.message, 'Failed to save payment information.');
        setErrorMessage(errorMsg);
        showToast?.(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = formatClientError(err?.message, 'An unexpected error occurred while saving payment information.');
      setErrorMessage(errorMsg);
      showToast?.(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = [
    {
      id: 'zelle',
      title: 'Zelle',
      subtitle: 'Fast bank-to-bank transfer using email or phone number',
      handleLabel: 'Zelle Registered Email / Mobile',
      handlePlaceholder: 'e.g. shareholder@example.com or 555-123-4567',
      badge: 'Direct Bank Transfer',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      activeColor: 'border-purple-600 ring-purple-600/10 bg-purple-50/20',
      radioColor: 'text-purple-600 focus:ring-purple-500',
    },
    {
      id: 'cashapp',
      title: 'CashApp',
      subtitle: 'Direct deposit to your $Cashtag account',
      handleLabel: 'CashApp $Cashtag',
      handlePlaceholder: 'e.g. $JohnDoe',
      badge: 'Mobile Wallet',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeColor: 'border-emerald-600 ring-emerald-600/10 bg-emerald-50/20',
      radioColor: 'text-emerald-600 focus:ring-emerald-500',
    },
    {
      id: 'check',
      title: 'Check',
      subtitle: 'Physical or e-check issued directly to your account',
      handleLabel: 'Delivery Address / Reference',
      handlePlaceholder: 'e.g. 123 Financial Way, Suite 400, NY',
      badge: 'Standard Mail / Issued Check',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      activeColor: 'border-blue-600 ring-blue-600/10 bg-blue-50/20',
      radioColor: 'text-blue-600 focus:ring-blue-500',
    },
  ];

  const currentOption = paymentOptions.find((opt) => opt.id === selectedType) || paymentOptions[0];
  const hasActivePayment = !!paymentMethod || showSuccess;

  return (
    <div className="w-full flex-1 flex flex-col lg:min-h-0">
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col lg:min-h-0"
      >
        {/* Hidden input to guarantee the selected payout type is submitted */}
        <input type="hidden" name="paymentType" value={selectedType} />

        {/* 2-COLUMN ON LARGE SCREENS (lg:), NATURAL VERTICALLY SCROLLING ON SMALL & MEDIUM SCREENS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 flex-1 lg:min-h-0">
          {/* LEFT COLUMN: ACTIVE STATUS + STEP 1 METHOD SELECTION */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 sm:gap-3 lg:min-h-0">
            {/* CURRENT PAYOUT DESTINATION CARD */}
            {hasActivePayment ? (
              <div className="p-3 sm:p-3.5 bg-gradient-to-br from-[#000033] via-slate-900 to-blue-950 rounded-2xl text-white shadow-xs border border-slate-800 flex items-center gap-3 shrink-0">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center font-black shadow-inner shrink-0 ring-2 ring-white/10">
                  <CreditCardIcon className="h-5 w-5 text-white" />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-black tracking-tight truncate">
                      {accountName || paymentMethod?.account_name || user?.fullName || 'Shareholder'}
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <ShieldCheckIcon className="h-3 w-3" />
                      Active Rail
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 truncate">
                    Rail: <strong className="text-white capitalize">{selectedType || paymentMethod?.payment_type}</strong>
                    {(accountHandle || paymentMethod?.account_handle) && (
                      <span className="text-blue-300 font-mono ml-1.5">
                        ({accountHandle || paymentMethod?.account_handle})
                      </span>
                    )}
                  </p>

                  {(accountNumber || paymentMethod?.account_number) && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      Acct: •••• {(accountNumber || paymentMethod?.account_number).slice(-4)}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs text-slate-500 flex items-center gap-2.5 shrink-0">
                <CreditCardIcon className="h-5 w-5 text-slate-400 shrink-0" />
                <p className="font-medium text-[11px]">No disbursement rail configured yet. Select a method below.</p>
              </div>
            )}

            {/* VIEW TRANSACTION LEDGER BUTTON */}
            <button
              type="button"
              onClick={() => setIsLedgerModalOpen(true)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800 shrink-0">
                  <ReceiptPercentIcon className="h-4 w-4" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                    Transaction Ledger & Dividends
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium truncate block">
                    View payouts, capital investments & statements
                  </span>
                </div>
              </div>
              <ArrowTopRightOnSquareIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
            </button>

            {/* STEP 1: PAYMENT METHOD TILES */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs flex flex-col lg:min-h-0 lg:flex-1 transition-colors duration-200">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800 mb-2 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-xs font-black text-[#000033] dark:text-white uppercase tracking-wider">
                    1. Select Payout Method
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Choose your preferred disbursement rail
                  </p>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                  Step 1
                </span>
              </div>

              <div className="space-y-1.5 lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-0.5 custom-scrollbar">
                {paymentOptions.map((opt) => {
                  const isSelected = selectedType === opt.id;
                  return (
                    <label
                      key={opt.id}
                      htmlFor={`payment-type-${opt.id}`}
                      className={`relative flex items-center justify-between p-2 sm:p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? `${opt.activeColor} shadow-2xs`
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="radio"
                          id={`payment-type-${opt.id}`}
                          name="paymentTypeRadio"
                          value={opt.id}
                          checked={isSelected}
                          onChange={() => {
                            setSelectedType(opt.id);
                            if (errorMessage) setErrorMessage(null);
                          }}
                          className={`h-4 w-4 ${opt.radioColor} border-slate-300 dark:border-slate-600 transition-colors cursor-pointer shrink-0`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-[#000033] dark:text-white">
                              {opt.title}
                            </span>
                            <span
                              className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${opt.badgeColor}`}
                            >
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                            {opt.subtitle}
                          </p>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* SECURITY & POLICY CALLOUT */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2 text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                <InformationCircleIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-tight font-medium">
                  Encrypted storage with audit logging before dividends or redemptions are released.
                </p>
              </div>
            </div>
          </div>

            {/* RIGHT COLUMN: STEP 2 ACCOUNT DETAILS & ACTION */}
            <div className="lg:col-span-7 flex flex-col lg:min-h-0">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-3.5 sm:p-5 flex flex-col justify-between lg:flex-1 lg:min-h-0 transition-colors duration-200">
                <div className="space-y-3 lg:flex-1 lg:min-h-0 lg:overflow-y-auto pr-1 custom-scrollbar">
                  <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-xs font-black text-[#000033] dark:text-white uppercase tracking-wider">
                        2. Account Details
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Parameters for {currentOption.title} disbursements
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                      Step 2
                    </span>
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <label
                        htmlFor="accountName"
                        className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[11px]"
                      >
                        Account Name <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-medium">Official beneficiary</span>
                    </div>
                    <input
                      id="accountName"
                      name="accountName"
                      value={accountName}
                      onChange={(e) => {
                        setAccountName(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      required
                      placeholder="e.g. Johnathan Doe"
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Account Handle & Account Number */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                    {/* Account Handle */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor="accountHandle"
                          className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[11px]"
                        >
                          Account Handle
                        </label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {selectedType === 'zelle'
                            ? 'Email / Phone'
                            : selectedType === 'cashapp'
                            ? '$Cashtag'
                            : 'Address'}
                        </span>
                      </div>
                      <input
                        id="accountHandle"
                        name="accountHandle"
                        value={accountHandle}
                        onChange={(e) => {
                          setAccountHandle(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder={currentOption.handlePlaceholder}
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>

                    {/* Account Number */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <label
                          htmlFor="accountNumber"
                          className="font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 text-[11px]"
                        >
                          Account / Routing #
                        </label>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Digits Only</span>
                      </div>
                      <input
                        id="accountNumber"
                        name="accountNumber"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={accountNumber}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, '');
                          setAccountNumber(cleaned);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* ACTION BAR: Clean, single status indicator + SubmitButton */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900 transition-colors duration-200">
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    {errorMessage ? (
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-200/80 dark:border-rose-800 animate-in fade-in">
                        <ExclamationCircleIcon className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span className="truncate">{errorMessage}</span>
                      </div>
                    ) : (
                      <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                        Updated payment settings apply to all upcoming distributions.
                      </p>
                    )}
                  </div>
                  <SubmitButton isSubmitting={isSubmitting} showSuccess={showSuccess} hasError={!!errorMessage} />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* SHAREHOLDER TRANSACTION & DIVIDENDS LEDGER MODAL */}
        {isLedgerModalOpen && (
          <ShareholderLedgerModal
            isOpen={isLedgerModalOpen}
            onClose={() => setIsLedgerModalOpen(false)}
            user={user}
          />
        )}
      </div>
  );
}
