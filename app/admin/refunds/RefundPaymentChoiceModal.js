'use client';

import { useMemo, useState, useTransition } from 'react';
import { FormatCurrency } from '../../_lib/utils';

export default function RefundPaymentChoiceModal({
  refund,
  ledger = [],
  createAction,
}) {
  const requestedTotal = Number(refund.refund_amount ?? 0);
  const alreadyRefunded = Number(refund.amount_refunded_so_far ?? 0);
  const remainingGoal = Math.max(0, requestedTotal - alreadyRefunded);
  const payments = refund.payments || [];

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

  const totalPaid = useMemo(
    () => payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [payments]
  );

  const ledgerBalance =
    ledger.length > 0
      ? Number(ledger[ledger.length - 1]?.running_balance ?? 0)
      : 0;
const sortedPayments = useMemo(() => {
  // Guard against undefined payments array
  if (!payments) return [];

  return [...payments]
    .filter((pay) => {
      // 1. Check the boolean flag from DB
      const isFullyRefunded = Boolean(pay.refunded);

      // 2. Calculate available using your NEW DB column
      const available =
        Number(pay.amount || 0) - Number(pay.refunded_amount || 0);

      // Only show if NOT fully refunded AND there is money left
      return !isFullyRefunded && available > 0;
    })
    .sort((a, b) => {
      // Sort by remaining capacity (highest first)
      const availA = Number(a.amount || 0) - Number(a.refunded_amount || 0);
      const availB = Number(b.amount || 0) - Number(b.refunded_amount || 0);
      return availB - availA;
    });
}, [payments]);

  const selectedPayment = useMemo(
    () => payments.find((p) => p.id === selectedId),
    [payments, selectedId]
  );

  const paymentCapacity = selectedPayment
    ? Number(
        selectedPayment.amount - (selectedPayment.refund_amount_so_far || 0)
      )
    : 0;

  const refundableNow = Math.max(
    0,
    Math.min(remainingGoal, paymentCapacity, ledgerBalance)
  );

  const isTestPayment = (p) =>
    p.stripe_session_id?.includes('test') ||
    p.stripe_payment_intent_id?.includes('test') ||
    p.stripe_charge_id?.includes('test');

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

  // SUCCESS STATE
  if (successData) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-md p-6 md:p-8 text-center animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-8 h-8 md:w-10 md:h-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-2">
            Refund Processed
          </h2>
          <p className="text-slate-500 mb-6 md:mb-8 text-sm md:base">
            The transaction was successful via Stripe.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 md:p-5 border border-slate-100 mb-6 md:mb-8 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-slate-500 font-medium">Amount</span>
              <span className="font-bold text-slate-900">
                {FormatCurrency(refundableNow)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Recipient</span>
              <span className="font-bold text-slate-900">
                {refund.students?.fullName}
              </span>
            </div>
          </div>

          <button
            onClick={closeAndClear}
            className="w-full bg-slate-900 hover:bg-black text-white py-3 md:py-4 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <input type="hidden" name="refundId" value={refund.id} />
        <input type="hidden" name="paymentId" value={selectedId || ''} />

        {/* HEADER - Sticky */}
        <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 border-b flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Process Refund
            </h2>
            <p className="text-slate-500 text-xs md:text-sm font-medium">
              Review and select source
            </p>
          </div>
          <button
            type="button"
            onClick={closeAndClear}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          {/* QUICK STATS - Horizontal Scroll on small screens, Grid on md+ */}
          <div className="flex overflow-x-auto md:grid md:grid-cols-3 gap-3 md:gap-4 pb-2 md:pb-0 scrollbar-hide">
            <StatCard label="Total Paid" value={FormatCurrency(totalPaid)} />
            <StatCard
              label="Ledger"
              value={FormatCurrency(ledgerBalance)}
              color="text-blue-600"
            />
            <StatCard
              label="Remaining"
              value={FormatCurrency(remainingGoal)}
              color="text-rose-600"
            />
          </div>

          {/* CONTEXT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Section title="Reference Info">
              <KeyValue
                label="Refund ID"
                value={`#${String(refund.id).slice(-6)}`}
              />
              <KeyValue label="Booking" value={`#${refund.booking_id}`} />
              <KeyValue label="Date" value={formatDate(refund.created_at)} />
              <KeyValue label="Client" value={refund.students?.fullName} />
            </Section>

            <Section title="Reason">
              <p className="text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                {refund.reason
                  ? `“${refund.reason}”`
                  : 'No specific reason provided.'}
              </p>
            </Section>
          </div>

          {/* PAYMENT SELECTION */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] mb-4">
              Select Stripe Source
            </p>
            <div className="grid gap-3">
              {sortedPayments.length > 0 ? (
                sortedPayments.map((pay) => {
                  const available = pay.amount - (pay.refunded_amount || 0);
                  const isSelected = selectedId === pay.id;

                  return (
                    <button
                      key={pay.id}
                      type="button"
                      disabled={available <= 0}
                      onClick={() => setSelectedId(pay.id)}
                      className={`relative flex flex-col border-2 rounded-xl md:rounded-2xl p-4 md:p-5 text-left transition-all ${
                        available <= 0
                          ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-100'
                          : isSelected
                            ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-600/10'
                            : 'border-slate-100 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-base md:text-lg font-bold text-slate-900">
                          {FormatCurrency(pay.amount)}
                        </span>
                        <span
                          className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${
                            isTestPayment(pay)
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isTestPayment(pay) ? 'Test' : 'Live'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-500">
                          Avail: {FormatCurrency(available)}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          …{String(pay.id).slice(-6)}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 md:-right-2 md:-top-2 w-5 h-5 md:w-6 md:h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3 h-3 md:w-4 md:h-4"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 md:p-8 text-center bg-slate-50/50">
                  <p className="text-slate-500 text-sm font-semibold">
                    No Refundable Payments
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER - Sticky */}
        <div className="p-4 sm:p-6 md:p-8 bg-slate-50 border-t border-slate-100 space-y-4 shrink-0 pb-6 md:pb-8">
          {selectedPayment && (
            <div className="flex items-start md:items-center gap-3 text-xs md:text-sm text-slate-600 font-medium px-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 md:mt-0"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15h.253a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                Issuing{' '}
                <strong className="text-slate-900">
                  {FormatCurrency(refundableNow)}
                </strong>{' '}
                to the customer.
              </span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedId || refundableNow <= 0 || isPending}
            className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-xl active:scale-[0.98]"
          >
            {isPending
              ? 'Processing...'
              : `Refund ${FormatCurrency(refundableNow)}`}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Sub-Components (Cleaned up for Mobile) ---------- */

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em]">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function KeyValue({ label, value }) {
  return (
    <div className="flex justify-between text-xs md:text-sm py-1 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function StatCard({ label, value, color = 'text-slate-900' }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 md:p-4 min-w-[120px] md:min-w-0 flex-shrink-0">
      <p className="text-xs font-black text-slate-400 uppercase tracking-tighter mb-0.5 md:mb-1">
        {label}
      </p>
      <p className={`text-base md:text-xl font-black ${color}`}>{value}</p>
    </div>
  );
}
