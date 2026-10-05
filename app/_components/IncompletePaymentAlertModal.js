'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  CreditCardIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckCircleIcon,
  SparklesIcon,
  BuildingLibraryIcon,
  BanknotesIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';
import { savePaymentMethod } from '@/app/_lib/actions';
import toast from 'react-hot-toast';

export default function IncompletePaymentAlertModal({
  isIncomplete = false,
  user = {},
  initialPaymentMethod = null,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [showAlert, setShowAlert] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Form states
  const [paymentType, setPaymentType] = useState(
    initialPaymentMethod?.payment_type && initialPaymentMethod.payment_type !== 'none'
      ? initialPaymentMethod.payment_type
      : 'zelle'
  );
  const [accountName, setAccountName] = useState(
    initialPaymentMethod?.account_name || user?.fullName || ''
  );
  const [accountHandle, setAccountHandle] = useState(
    initialPaymentMethod?.account_handle || ''
  );
  const [accountNumber, setAccountNumber] = useState(
    initialPaymentMethod?.account_number || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Trigger 5-second timer on login
  useEffect(() => {
    // If payment info is complete, or user dismissed alert in this session, don't show
    if (!isIncomplete || isDismissed) {
      setShowAlert(false);
      return;
    }

    // If user is already on the dedicated /account/payment page, don't show the alert popup
    if (pathname === '/account/payment') {
      setShowAlert(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowAlert(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [isIncomplete, pathname, isDismissed]);

  const handleOpenModal = () => {
    setShowAlert(false);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!accountName.trim()) {
      setFormError('Account beneficiary legal name is required.');
      return;
    }

    if (!accountHandle.trim()) {
      setFormError(
        paymentType === 'zelle'
          ? 'Zelle registered mobile number or email address is required.'
          : paymentType === 'cashapp'
          ? 'CashApp $Cashtag identifier is required.'
          : 'Physical mailing address is required for check delivery.'
      );
      return;
    }

    if (accountNumber && !/^\d+$/.test(accountNumber.trim())) {
      setFormError('Account reference number must contain only numeric digits.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('paymentType', paymentType);
      formData.append('accountName', accountName.trim());
      formData.append('accountHandle', accountHandle.trim());
      formData.append('accountNumber', accountNumber.trim());

      const res = await savePaymentMethod(null, formData);

      if (res?.success) {
        toast.success('Payment disbursement information saved successfully!');
        setIsModalOpen(false);
        setShowAlert(false);
        setIsDismissed(true);

        // Return / refresh dashboard
        router.push('/account');
        router.refresh();
      } else {
        setFormError(res?.message || 'Failed to save payment information.');
      }
    } catch (err) {
      setFormError(err?.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = [
    {
      id: 'zelle',
      title: 'Zelle',
      subtitle: 'Direct transfer to registered email or phone',
      handleLabel: 'Zelle Registered Email or Mobile Number',
      placeholder: 'e.g. shareholder@example.com or 555-123-4567',
      icon: <BuildingLibraryIcon className="h-5 w-5 text-purple-600" />,
      colorClass: 'border-purple-600 ring-2 ring-purple-600/10 bg-purple-50/30 dark:bg-purple-950/20',
      badge: 'Fastest (0% Fee)',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    },
    {
      id: 'cashapp',
      title: 'CashApp',
      subtitle: 'Disbursement to your $Cashtag account',
      handleLabel: 'CashApp $Cashtag Identifier',
      placeholder: 'e.g. $JohnDoe or $ShareholderTag',
      icon: <BanknotesIcon className="h-5 w-5 text-emerald-600" />,
      colorClass: 'border-emerald-600 ring-2 ring-emerald-600/10 bg-emerald-50/30 dark:bg-emerald-950/20',
      badge: 'Instant Transfer',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
    },
    {
      id: 'check',
      title: 'Check (Mailing)',
      subtitle: 'Physical paper check sent via postal mail',
      handleLabel: 'Complete Mailing Address for Checks',
      placeholder: 'Street Address, Apt/Suite, City, State ZIP Code',
      icon: <DocumentTextIcon className="h-5 w-5 text-blue-600" />,
      colorClass: 'border-blue-600 ring-2 ring-blue-600/10 bg-blue-50/30 dark:bg-blue-950/20',
      badge: 'Postal Delivery',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    },
  ];

  return (
    <>
      {/* 5-SECOND ALERT POPUP BUTTON */}
      {showAlert && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-6 fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-amber-400 dark:border-amber-500/80 shadow-amber-500/10 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                    Action Required
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    Payment Information Incomplete
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAlert(false);
                  setIsDismissed(true);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Dismiss"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Your disbursement method is not configured. Set up your payout rail so Winam can deposit your quarterly dividends and redemptions.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleOpenModal}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCardIcon className="h-4 w-4 text-blue-200" />
                <span>Complete Payment Information</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SETUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <CreditCardIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Set Up Payout Information
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Select your disbursement rail to receive payouts and dividend distributions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Payment Rail Selection */}
              <div className="space-y-2">
                <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                  Select Payout Rail
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {paymentOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentType(opt.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        paymentType === opt.id
                          ? opt.colorClass
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        {opt.icon}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${opt.badgeColor}`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block text-xs">
                          {opt.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                          {opt.subtitle}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Beneficiary Legal Name */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                  Beneficiary Account Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Official legal name registered on receiving account"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Identifier / Handle */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                  {paymentOptions.find((o) => o.id === paymentType)?.handleLabel || 'Handle / Address'} *
                </label>
                <input
                  type="text"
                  required
                  value={accountHandle}
                  onChange={(e) => setAccountHandle(e.target.value)}
                  placeholder={paymentOptions.find((o) => o.id === paymentType)?.placeholder}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Optional Account Reference Number */}
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-slate-500 text-[10px] block">
                  Account Reference / Last 4 Digits (Optional)
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Numeric digits only (e.g. 1234)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {/* Security Note */}
              <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <ShieldCheckIcon className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <span>
                  Disbursement details are stored securely and encrypted for compliance. Only official Winam disbursements will be transferred to this rail.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="h-3.5 w-3.5 text-blue-200" />
                      <span>Save & Return to Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
