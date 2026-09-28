'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  XMarkIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import { FormatCurrency } from '@/app/_lib/utils';
import {
  submitInvestmentRequest,
  getPaymentMode,
  submitManualInvestmentNotice,
} from '../_lib/actions';

export default function InvestModal({
  opportunity,
  onClose,
  user,
  initialPaymentMode = null,
}) {
  const router = useRouter();

  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState(initialPaymentMode); // 'stripe', 'manual', or null while loading
  const [selectedMethod, setSelectedMethod] = useState('cashapp'); // 'cashapp' or 'zelle'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // Limits from opportunity - Maximum capped at $10,000 for all opportunities
  const min = opportunity?.minimum_investment || 0;
  const OPPORTUNITY_MAX_LIMIT = 10000;
  const rawMax =
    opportunity?.remaining_capacity ?? opportunity?.total_value ?? OPPORTUNITY_MAX_LIMIT;
  const max = Math.min(OPPORTUNITY_MAX_LIMIT, rawMax);

  // Memo note for manual transfer
  const userName = user?.name || user?.email?.split('@')[0] || 'Investor';
  const memoText = `${opportunity?.name || 'Investment'} - ${userName}`;

  // Fetch live payment mode setting if not provided initially
  useEffect(() => {
    if (initialPaymentMode) {
      setPaymentMode(initialPaymentMode);
      return;
    }
    async function loadMode() {
      try {
        const mode = await getPaymentMode();
        setPaymentMode(mode || 'manual');
      } catch (err) {
        console.warn('Could not load payment mode, defaulting to manual:', err);
        setPaymentMode('manual');
      }
    }
    loadMode();
  }, [initialPaymentMode]);

  // Copy helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const formatWithCommas = (value) => {
    if (!value) return '';
    const parts = value.split('.');
    parts[0] = Number(parts[0]).toLocaleString('en-US');
    return parts.join('.');
  };

  ////////////////////////////////////////////////////////////
  // HANDLE INVEST / SUBMIT
  ////////////////////////////////////////////////////////////
  const handleInvest = async (e) => {
    e.preventDefault();

    const value = Number(amount);

    // FRONTEND VALIDATION
    if (!value || value < min) {
      setError(`Minimum investment is ${FormatCurrency(min)}`);
      return;
    }

    if (value > max) {
      setError(`Only ${FormatCurrency(max)} available`);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // 1. STRIPE MODE
      if (paymentMode === 'stripe') {
        const result = await submitInvestmentRequest({
          opportunityId: opportunity.id,
          amount: value,
        });

        if (!result?.ok) {
          setIsSubmitting(false);
          setError(result?.message || 'Investment failed.');
          return;
        }

        // Redirect directly to Stripe checkout
        if (result.url) {
          window.location.assign(result.url);
          return;
        }

        setIsSubmitting(false);
        setStep(2);
        return;
      }

      // 2. MANUAL (Zelle / Cash App) MODE
      const res = await submitManualInvestmentNotice({
        opportunityId: opportunity.id,
        amount: value,
        paymentMethod: selectedMethod,
        memoNote: memoText,
      });

      setIsSubmitting(false);

      if (!res?.ok) {
        setError(res?.message || 'Failed to submit payment confirmation.');
        return;
      }

      setStep(2);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="relative p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-center">
          <h2 className="text-xl font-bold text-slate-900 text-center px-8">
            Invest in {opportunity?.name}
          </h2>

          <button
            onClick={onClose}
            className="absolute right-5 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-slate-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 max-h-[85vh] overflow-y-auto">
          {step === 1 ? (
            <form onSubmit={handleInvest} className="space-y-6">
              {/* AMOUNT INPUT - ORIGINAL STRIPE MODAL INPUT */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Investment Amount (USD)
                </label>

                <div className="relative">
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    placeholder={`Min. ${FormatCurrency(min)}`}
                    value={formatWithCommas(amount)}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = raw.split('.');
                      if (parts.length > 2) return;
                      setAmount(raw);
                      setError('');
                    }}
                    className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-green-500 focus:ring-0 transition-all text-xl font-bold"
                  />
                </div>

                {/* HELPER TEXT */}
                <p className="mt-2 text-xs text-slate-500">
                  Minimum: {FormatCurrency(min)} • Available For Purchase:{' '}
                  {FormatCurrency(max)}
                </p>

                {/* ERROR */}
                {error && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {error}
                  </p>
                )}
              </div>

              {/* SUMMARY BOX - ORIGINAL STRIPE MODAL SUMMARY */}
              <div className="bg-indigo-50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700">Estimated Shares:</span>
                  <span className="font-bold text-indigo-900">
                    {amount
                      ? (Number(amount) / (min || 1)).toLocaleString()
                      : 0}{' '}
                    units
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700">Platform Fee:</span>
                  <span className="font-bold text-indigo-900">
                    {FormatCurrency(0)} (Waived)
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-indigo-700">Expected Return:</span>
                  <span className="font-bold text-indigo-900">
                    {opportunity?.expected_return ?? 0}%
                  </span>
                </div>
              </div>

              {/* MANUAL (ZELLE / CASH APP) OPTIONS (ONLY IN MANUAL MODE) */}
              {paymentMode === 'manual' && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Choose Method of Payment:
                    </label>

                    <div className="grid grid-cols-2 gap-2.5">
                      {/* CASH APP SELECTOR */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('cashapp')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                          selectedMethod === 'cashapp'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-black text-sm text-emerald-700">
                            Cash App
                          </span>
                          {selectedMethod === 'cashapp' && (
                            <CheckIcon className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          $Winam
                        </span>
                      </button>

                      {/* ZELLE SELECTOR */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('zelle')}
                        className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                          selectedMethod === 'zelle'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-black text-sm text-purple-700">
                            Zelle
                          </span>
                          {selectedMethod === 'zelle' && (
                            <CheckIcon className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          346-314-3469
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE METHOD DETAILS */}
                  {selectedMethod === 'cashapp' ? (
                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-emerald-800 uppercase block">
                            Cash App Handle
                          </span>
                          <span className="text-lg font-mono font-black text-emerald-900">
                            $Winam
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('$Winam', 'cashapp_handle')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          {copiedField === 'cashapp_handle' ? (
                            <>
                              <CheckIcon className="h-3.5 w-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                              Copy $Winam
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-xs text-emerald-900/80 flex items-center justify-between pt-2 border-t border-emerald-200/60">
                        <span>Associated Phone:</span>
                        <span className="font-mono font-bold">3463143469</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-purple-900 uppercase block">
                            Zelle Phone
                          </span>
                          <span className="text-base font-mono font-black text-purple-950">
                            346-314-3469
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy('3463143469', 'zelle_phone')}
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          {copiedField === 'zelle_phone' ? (
                            <>
                              <CheckIcon className="h-3.5 w-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                              Copy Phone
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-purple-200/60">
                        <div className="overflow-hidden">
                          <span className="text-xs font-bold text-purple-900 uppercase block">
                            Zelle Email
                          </span>
                          <span className="text-xs font-semibold text-purple-950 truncate block">
                            winamdevelopmentgroup@gmail.com
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              'winamdevelopmentgroup@gmail.com',
                              'zelle_email'
                            )
                          }
                          className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm flex-shrink-0"
                        >
                          {copiedField === 'zelle_email' ? (
                            <>
                              <CheckIcon className="h-3.5 w-3.5" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                              Copy Email
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* REQUIRED TRANSFER MEMO */}
                  <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wide">
                        <InformationCircleIcon className="h-4 w-4 text-amber-700" />
                        <span>Required Transfer Memo</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(memoText, 'memo')}
                        className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                      >
                        {copiedField === 'memo' ? (
                          <>
                            <CheckIcon className="h-3 w-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <ClipboardDocumentIcon className="h-3 w-3" />
                            Copy Memo
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 bg-white border border-amber-300/80 rounded-xl font-mono text-xs font-black text-slate-800 select-all">
                      {memoText}
                    </div>

                    <p className="text-xs text-amber-900/80 leading-relaxed">
                      Please enter this exact memo when making the transfer so our team can immediately credit your investment.
                    </p>
                  </div>
                </div>
              )}

              {/* ACTION BUTTON */}
              {paymentMode === 'stripe' ? (
                /* ORIGINAL STRIPE BUTTON */
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !amount ||
                    Number(amount) < min ||
                    Number(amount) > max
                  }
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <BanknotesIcon className="h-6 w-6" />
                      Confirm Investment
                    </>
                  )}
                </button>
              ) : paymentMode === 'manual' ? (
                /* MANUAL MODE BUTTON */
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !amount ||
                    Number(amount) < min ||
                    Number(amount) > max
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <BanknotesIcon className="h-6 w-6" />
                      I Have Sent the Payment
                    </>
                  )}
                </button>
              ) : (
                /* LOADING SKELETON BUTTON */
                <div className="w-full bg-slate-200 py-4 rounded-2xl flex items-center justify-center">
                  <div className="h-6 w-6 border-2 border-slate-400/40 border-t-slate-700 rounded-full animate-spin" />
                </div>
              )}
            </form>
          ) : (
            /* SUCCESS STATE - ORIGINAL STRIPE SUCCESS STATE */
            <div className="text-center py-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-12 w-12" />
              </div>

              <h3 className="text-2xl font-black text-slate-900">Success!</h3>

              <p className="text-slate-600">
                Your investment request for{' '}
                <span className="font-bold">{FormatCurrency(amount)}</span> in{' '}
                {opportunity?.name} has been received.
              </p>

              <button
                onClick={() => {
                  onClose();
                  router.push('/account/portfolio');
                }}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold mt-4"
              >
                Go to Portfolio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
