'use client';

import { useState, useTransition, useMemo } from 'react';
import { FormatCurrency } from '../../_lib/utils';

export default function RefundPaymentChoiceModal({
  refund,
  ledger = [],
  createAction,
}) {
  // -------------------------
  // REFUND INTENT
  // -------------------------
  const requestedTotal = Number(refund.refund_amount ?? 0);
  const alreadyRefunded = Number(refund.amount_refunded_so_far ?? 0);
  const remainingGoal = Math.max(0, requestedTotal - alreadyRefunded);

  const payments = refund.payments || [];

  // -------------------------
  // UI STATE
  // -------------------------
  const [selectedId, setSelectedId] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  // -------------------------
  // LEDGER BALANCE (GLOBAL CREDIT)
  // -------------------------
  const ledgerBalance =
    ledger.length > 0
      ? Number(ledger[ledger.length - 1]?.running_balance ?? 0)
      : 0;

  // -------------------------
  // REFUNDABLE PAYMENTS ONLY
  // -------------------------
  const refundablePayments = useMemo(() => {
    return payments
      .map((p) => {
        const remaining = Number(p.amount) - Number(p.refunded_amount || 0);

        return {
          ...p,
          remaining_refundable: remaining,
        };
      })
      .filter((p) => p.remaining_refundable > 0)
      .sort((a, b) => b.remaining_refundable - a.remaining_refundable);
  }, [payments]);

  // -------------------------
  // SELECTED PAYMENT
  // -------------------------
  const selectedPayment = useMemo(
    () => refundablePayments.find((p) => p.id === selectedId),
    [refundablePayments, selectedId]
  );

  const paymentCapacity = selectedPayment
    ? selectedPayment.remaining_refundable
    : 0;

  // -------------------------
  // FINAL EXECUTION AMOUNT
  // -------------------------
  const refundableNow = Math.max(
    0,
    Math.min(remainingGoal, paymentCapacity, ledgerBalance)
  );

  const isTestPayment = (p) =>
    p.stripe_session_id?.includes('test') ||
    p.stripe_payment_intent_id?.includes('test') ||
    p.stripe_charge_id?.includes('test');

  // -------------------------
  // SUBMIT
  // -------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedId || refundableNow <= 0) return;

    const formData = new FormData(e.currentTarget);
    formData.set('refundAmount', refundableNow.toString());

    startTransition(async () => {
      try {
        const result = await createAction(formData);
        if (result?.success) {
          setSuccessData(result);
        } else {
          setError(result?.error || 'Refund failed.');
        }
      } catch {
        setError('A system error occurred.');
      }
    });
  };

  const closeAndClear = () => {
    window.location.href = '/admin/refunds';
  };

  // -------------------------
  // SUCCESS VIEW
  // -------------------------
  if (successData) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
          <h2 className="text-2xl font-black mb-3">Refund Successful</h2>

          <div className="space-y-2 text-left text-sm bg-gray-50 p-4 rounded-xl border mb-6">
            <p>
              <strong>Processed:</strong> {FormatCurrency(refundableNow)}
            </p>
            <p>
              <strong>Client:</strong> {refund.students?.fullName}
            </p>
            <p>
              <strong>Stripe Ref:</strong> {successData.stripeRefundId}
            </p>
          </div>

          <button
            onClick={closeAndClear}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // -------------------------
  // MAIN MODAL
  // -------------------------
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <input type="hidden" name="refundId" value={refund.id} />
        <input type="hidden" name="paymentId" value={selectedId || ''} />

        {/* HEADER */}
        <div className="p-6 border-b bg-gray-50 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase">Process Refund</h2>
            <button
              type="button"
              onClick={closeAndClear}
              className="text-gray-400 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border p-3 rounded-xl">
              <p className="text-[9px] font-bold text-gray-400 uppercase">
                Refund Remaining
              </p>
              <p className="text-lg font-black text-red-600">
                {FormatCurrency(remainingGoal)}
              </p>
            </div>

            <div className="bg-white border p-3 rounded-xl">
              <p className="text-[9px] font-bold text-gray-400 uppercase">
                Ledger Balance
              </p>
              <p className="text-lg font-black text-blue-700">
                {FormatCurrency(ledgerBalance)}
              </p>
            </div>

            <div className="bg-white border p-3 rounded-xl">
              <p className="text-[9px] font-bold text-gray-400 uppercase">
                Payments Left
              </p>
              <p className="text-lg font-black">{refundablePayments.length}</p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {refundablePayments.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500 border-2 border-dashed rounded-xl">
              No remaining payments available for refund.
              <br />
              Any remaining balance must be handled as ledger credit.
            </div>
          ) : (
            <div className="grid gap-3">
              {refundablePayments.map((pay) => {
                const isSelected = selectedId === pay.id;

                return (
                  <button
                    key={pay.id}
                    type="button"
                    onClick={() => setSelectedId(pay.id)}
                    className={`text-left border-2 rounded-2xl p-4 transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 ring-4 ring-blue-50'
                        : 'bg-white border-gray-100 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-black text-xl">
                        {FormatCurrency(pay.amount)}
                      </p>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          isTestPayment(pay)
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {isTestPayment(pay) ? 'Test' : 'Live'}
                      </span>
                    </div>

                    <div className="mt-2 flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                      <span>
                        Refundable: {FormatCurrency(pay.remaining_refundable)}
                      </span>
                      <span className="opacity-50">
                        Ref …{String(pay.id).slice(-6)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t bg-gray-50 space-y-3">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedId || isPending || refundableNow <= 0}
            className="w-full bg-green-600 text-white font-black py-4 rounded-xl disabled:bg-gray-300"
          >
            {isPending
              ? 'PROCESSING STRIPE...'
              : `REFUND ${FormatCurrency(refundableNow)} FROM SELECTED PAYMENT`}
          </button>
        </div>
      </form>
    </div>
  );
}
