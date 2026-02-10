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


  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // -------------------------
  // TOTAL PAID
  // -------------------------
  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
  );

  // -------------------------
  // LEDGER BALANCE
  // -------------------------
  const ledgerBalance =
    ledger.length > 0
      ? Number(ledger[ledger.length - 1]?.running_balance ?? 0)
      : 0;

  // -------------------------
  // SORT PAYMENTS
  // -------------------------
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const availA = Number(a.amount - (a.refunded_amount || 0));
      const availB = Number(b.amount - (b.refunded_amount || 0));
      return availB - availA;
    });
  }, [payments]);

  const selectedPayment = useMemo(
    () => payments.find((p) => p.id === selectedId),
    [payments, selectedId]
  );

  const paymentCapacity = selectedPayment
    ? Number(selectedPayment.amount - (selectedPayment.refunded_amount || 0))
    : 0;

  // -------------------------
  // FINAL REFUND AMOUNT
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
        if (result?.success) setSuccessData(result);
        else setError(result?.error || 'Refund failed.');
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
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <h2 className="text-xl font-bold mb-4">Refund Completed</h2>

          <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-xl border mb-6">
            <p className="flex justify-between">
              <span>Amount</span>
              <span className="font-bold">{FormatCurrency(refundableNow)}</span>
            </p>
            <p className="flex justify-between">
              <span>Client</span>
              <span className="font-bold">{refund.students?.fullName}</span>
            </p>
            <p className="text-xs text-gray-500 break-all mt-2">
              Stripe ID: {successData.stripeRefundId}
            </p>
          </div>

          <button
            onClick={closeAndClear}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // -------------------------
  // MAIN MODAL
  // -------------------------
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <input type="hidden" name="refundId" value={refund.id} />
        <input type="hidden" name="paymentId" value={selectedId || ''} />

        {/* HEADER */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Process Refund</h2>
          <button
            type="button"
            onClick={closeAndClear}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* REFUND DETAILS */}
          <Section title="Refund Details">
            <KeyValue label="Refund ID" value={refund.id} />
            <KeyValue label="Booking ID" value={`#${refund.booking_id}`} />
            <KeyValue label="Client" value={refund.students?.fullName} />
            <KeyValue
              label="Requested Refund"
              value={`${FormatCurrency(requestedTotal)}`}
            />
            <KeyValue
              label="Date "
              value={`${formatDate(refund.created_at)}`}
            />
          </Section>

          {/* REASON */}
          <Section title="Reason for Refund">
            {refund.reason ? (
              <p className="text-sm text-gray-700 italic">“{refund.reason}”</p>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No reason provided.
              </p>
            )}
          </Section>

          {/* FINANCIAL SUMMARY */}
          <Section title="Financial Summary">
            <KeyValue label="Total Paid" value={FormatCurrency(totalPaid)} />
            <KeyValue
              label="Ledger Balance"
              value={FormatCurrency(ledgerBalance)}
            />
            <KeyValue
              label="Pending Refund"
              value={FormatCurrency(remainingGoal)}
            />
          </Section>

          {/* PAYMENT SELECTION */}
          <Section title="Select Payment Source">
            <div className="grid gap-3">
              {sortedPayments.map((pay) => {
                const available = pay.amount - (pay.refunded_amount || 0);
                const isSelected = selectedId === pay.id;

                return (
                  <button
                    key={pay.id}
                    type="button"
                    disabled={available <= 0}
                    onClick={() => setSelectedId(pay.id)}
                    className={`border rounded-xl p-4 text-left transition ${
                      available <= 0
                        ? 'opacity-40 cursor-not-allowed bg-gray-50'
                        : isSelected
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <strong>{FormatCurrency(pay.amount)}</strong>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isTestPayment(pay)
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {isTestPayment(pay) ? 'Test' : 'Live'}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>Available: {FormatCurrency(available)}</span>
                      <span>ID …{String(pay.id).slice(-6)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* CONFIRMATION */}
          {selectedPayment && (
            <Section title="Confirmation">
              <p className="text-sm">
                This will refund{' '}
                <strong>{FormatCurrency(refundableNow)}</strong>.
              </p>
              <p className="text-xs text-gray-500">
                Remaining on payment:{' '}
                {FormatCurrency(paymentCapacity - refundableNow)}
              </p>
            </Section>
          )}

          {/* FOOTER */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedId || refundableNow <= 0 || isPending}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold disabled:bg-gray-300"
          >
            {isPending
              ? 'Processing…'
              : `Confirm Refund of ${FormatCurrency(refundableNow)}`}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Section({ title, children }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="bg-gray-50 border rounded-xl p-4 space-y-2">
        {children}
      </div>
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
