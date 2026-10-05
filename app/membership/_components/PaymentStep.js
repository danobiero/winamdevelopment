'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import FeesPaymentButton from '../../_components/FeesPaymentButton';
import { submitManualFeeNotice } from '@/app/_lib/actions';

export default function PaymentStep({
  session,
  fee,
  status,
  paymentMode = 'manual',
  pendingFeePayment = null,
}) {
  const router = useRouter();

  const [selectedMethod, setSelectedMethod] = useState('cashapp'); // 'cashapp' | 'zelle'
  const [memoNote, setMemoNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [activePendingPayment, setActivePendingPayment] = useState(pendingFeePayment);
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  if (!fee) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-xl font-semibold text-slate-600">
          Preparing fee details...
        </h2>
        <p className="text-slate-400 mt-2">Connecting to Winam Treasury…</p>
      </div>
    );
  }

  const amount = Number(fee.amount || 100).toFixed(2);
  const applicantName = session?.user?.name || session?.user?.email || 'Applicant';
  const suggestedMemo = `Membership Fee - ${applicantName}`;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleSubmitNotice = async (e) => {
    e.preventDefault();
    if (!memoNote.trim()) {
      setError('Please provide your Cash App $Cashtag, Zelle reference, or sender name.');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);

      const res = await submitManualFeeNotice({
        feeId: fee.id,
        paymentMethod: selectedMethod,
        memoNote: memoNote.trim(),
        amount: Number(amount),
        email: session?.user?.email,
        shareholderId: session?.user?.shareholderId,
      });

      if (!res?.ok) {
        throw new Error(res?.message || 'Failed to submit payment notice.');
      }

      setActivePendingPayment(res.payment || {
        amount,
        payment_method_type: selectedMethod,
        status: 'pending',
        created_at: new Date().toISOString(),
        metadata: {
          memo: memoNote.trim(),
          method: selectedMethod,
        },
      });
      setIsEditingNotice(false);
      router.refresh();
    } catch (err) {
      console.error('Manual fee submit error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // VIEW 1: ACTIVE PENDING MANUAL PAYMENT VIEW
  // ============================================================
  if (activePendingPayment && !isEditingNotice) {
    const pMethod = activePendingPayment.payment_method_type || activePendingPayment.metadata?.method;
    const pMemo = activePendingPayment.metadata?.memo || '—';
    const submittedDate = activePendingPayment.created_at
      ? new Date(activePendingPayment.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Just now';

    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-2xl rounded-3xl p-8 md:p-12 text-center">
        <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-200">
          <ClockIcon className="h-10 w-10 text-amber-600 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase bg-amber-100 text-amber-800 border border-amber-200 mb-4">
          <ClockIcon className="h-4 w-4" />
          Pending Verification
        </div>

        <h2 className="text-3xl font-black text-primary-950 mb-2">
          Payment Notice Received!
        </h2>

        <p className="text-slate-600 mb-8 max-w-lg mx-auto">
          We recorded your manual payment notice for the application fee. Winam Treasury will reconcile your transfer and activate your Board Review step.
        </p>

        {/* Notice Receipt Box */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-left space-y-3 mb-8">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Application Fee
            </span>
            <span className="text-lg font-black text-slate-900">${amount}</span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Payment Rail:</span>
            <span className="font-bold text-slate-800 capitalize">
              {pMethod === 'cashapp'
                ? 'Cash App ($Winam)'
                : pMethod === 'zelle'
                  ? 'Zelle (346-314-3469)'
                  : pMethod || 'Manual Rail'}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Your Reference / Note:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-200/60 px-2 py-0.5 rounded text-xs">
              {pMemo}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
            <span className="text-slate-500">Submitted On:</span>
            <span className="text-xs text-slate-600 font-semibold">{submittedDate}</span>
          </div>
        </div>

        {/* Informative Guidance */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-left text-xs text-blue-900 space-y-1 mb-8 flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Next Steps:</p>
            <p className="text-blue-800">
              An administrator will verify your transfer against our banking ledger. Once approved, this roadmap will automatically update to <strong>Board Review</strong>. You do not need to submit another payment.
            </p>
          </div>
        </div>

        {/* Option to re-edit */}
        <button
          type="button"
          onClick={() => setIsEditingNotice(true)}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 underline transition-colors"
        >
          Need to update your payment reference or resubmit?
        </button>
      </div>
    );
  }

  // ============================================================
  // VIEW 2: APPLICATION FEE PAYMENT FORM
  // ============================================================
  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-2xl rounded-3xl p-8 md:p-12 text-center">
      <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircleIcon className="h-12 w-12 text-emerald-600" />
      </div>

      <h2 className="text-3xl font-black text-primary-950 mb-2">
        Application Received!
      </h2>

      <p className="text-slate-600 mb-8">
        Your details are in our system. To proceed to Board Review, please complete
        the one-time administrative processing fee.
      </p>

      {/* Summary Card */}
      <div className="bg-slate-50 rounded-2xl p-6 mb-8 text-left border border-slate-100">
        <div className="flex justify-between mb-2">
          <span className="text-slate-500">{fee.name}</span>
          <span className="font-bold text-slate-900">${amount}</span>
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
          <span className="font-bold text-primary-950">Total Due</span>
          <span className="font-black text-primary-950">${amount}</span>
        </div>
      </div>

      {/* =======================================================
          MANUAL PAYMENT MODE (ZELLE / CASH APP)
         ======================================================= */}
      {paymentMode === 'manual' ? (
        <form onSubmit={handleSubmitNotice} className="text-left space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Select Payment Method:
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* CASH APP TAB */}
              <button
                type="button"
                onClick={() => setSelectedMethod('cashapp')}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  selectedMethod === 'cashapp'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
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

              {/* ZELLE TAB */}
              <button
                type="button"
                onClick={() => setSelectedMethod('zelle')}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  selectedMethod === 'zelle'
                    ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className="font-black text-sm text-purple-700">
                    Zelle
                  </span>
                  {selectedMethod === 'zelle' && (
                    <CheckIcon className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <span className="text-xs font-mono font-bold text-slate-800">
                  346-314-3469
                </span>
              </button>
            </div>
          </div>

          {/* ACTIVE METHOD TRANSFER DETAILS */}
          {selectedMethod === 'cashapp' ? (
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase block tracking-wider">
                    Official Cash App Tag
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-950">
                    $Winam
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy('$Winam', 'cashapp_tag')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {copiedField === 'cashapp_tag' ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-4 w-4" />
                      Copy $Tag
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-900 space-y-1.5">
                <p className="font-bold">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-emerald-800">
                  <li>Send <strong>${amount}</strong> to <strong>$Winam</strong>.</li>
                  <li>Include memo: <code>{suggestedMemo}</code></li>
                  <li>Enter your Cash App $Cashtag below and submit notice.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-800 uppercase block tracking-wider">
                    Zelle Recipient Phone
                  </span>
                  <span className="text-2xl font-mono font-black text-purple-950">
                    346-314-3469
                  </span>
                  <span className="text-xs text-purple-700 font-semibold block mt-0.5">
                    Winam Development Group
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy('346-314-3469', 'zelle_phone')}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {copiedField === 'zelle_phone' ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="h-4 w-4" />
                      Copy Number
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-purple-200/60 text-xs text-purple-900 space-y-1.5">
                <p className="font-bold">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-purple-800">
                  <li>Send <strong>${amount}</strong> to <strong>346-314-3469</strong>.</li>
                  <li>Include memo: <code>{suggestedMemo}</code></li>
                  <li>Enter your Zelle sender name or reference below and submit notice.</li>
                </ol>
              </div>
            </div>
          )}

          {/* REFERENCE INPUT */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {selectedMethod === 'cashapp'
                ? 'Your Cash App $Cashtag / Reference:'
                : 'Your Zelle Sender Name / Confirmation Reference:'}
            </label>
            <input
              type="text"
              required
              value={memoNote}
              onChange={(e) => setMemoNote(e.target.value)}
              placeholder={
                selectedMethod === 'cashapp'
                  ? 'e.g. $JohnDoe or Txn #12345'
                  : 'e.g. John Doe / Bank Confirmation #12345'
              }
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium text-slate-900 text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used by administrators to match your bank/app deposit with your application.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || !memoNote.trim()}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  Submitting Payment Notice...
                </>
              ) : (
                <>
                  <BanknotesIcon className="h-5 w-5" />
                  Submit Payment Notice (${amount})
                </>
              )}
            </button>

            {isEditingNotice && (
              <button
                type="button"
                onClick={() => setIsEditingNotice(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel and keep existing notice
              </button>
            )}
          </div>
        </form>
      ) : (
        /* =======================================================
            STRIPE CARD MODE
           ======================================================= */
        <div className="w-full">
          <FeesPaymentButton
            feeId={fee.id}
            email={session?.user?.email}
            shareholderId={session?.user?.shareholderId}
            amount={amount}
          />
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400 uppercase tracking-widest">
        Secure Payment via Winam Treasury
      </p>
    </div>
  );
}
