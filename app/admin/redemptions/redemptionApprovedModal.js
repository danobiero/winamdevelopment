'use client';

import { useRouter } from 'next/navigation';

const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value ?? 0);

export default function RedemptionApprovedModal({ redemption }) {
  const router = useRouter();

  // Guard clause to prevent crashes if data hasn't loaded yet
  if (!redemption) return null;

  // Get the latest payment for the shareholder
  const latestPayment = redemption.payments?.length
    ? [...redemption.payments].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0]
    : null;

  const paymentIntent = latestPayment?.stripe_payment_intent_id;
  const chargeId = latestPayment?.stripe_charge_id;

  const amountCents = Math.round((redemption.amount ?? 0) * 100);

  // Determine test or live mode
  const isTestMode =
    (paymentIntent &&
      (paymentIntent.includes('test') ||
        paymentIntent.startsWith('pi_test'))) ||
    (chargeId && chargeId.includes('test'));

  const baseUrl = isTestMode
    ? 'https://dashboard.stripe.com/test/payments'
    : 'https://dashboard.stripe.com/payments';

  let stripeRefundUrl = null;
  if (paymentIntent) {
    stripeRefundUrl = `${baseUrl}/${paymentIntent}/refund?amount=${amountCents}&reason=requested_by_customer`;
  } else if (chargeId) {
    stripeRefundUrl = `${baseUrl}/${chargeId}/refund?amount=${amountCents}&reason=requested_by_customer`;
  }

  const handleClose = () => {
    router.push('/admin/redemptions');
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-black mb-4 text-emerald-600">
          Redemption Approved
        </h2>

        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Redemption ID:</span>
            <span className="font-mono font-bold text-slate-700">
              #{String(redemption.id).slice(0, 8)}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Investment:</span>
            <span className="font-mono font-bold text-slate-700">
              #{redemption.investment_id}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Shareholder:</span>
            <span className="font-bold text-slate-900">
              {redemption.shareholders?.fullName}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-slate-500 font-medium">Amount:</span>
            <span className="font-black text-emerald-600">
              {formatCurrency(redemption.amount, redemption.currency)}
            </span>
          </div>
          <div className="pt-1">
            <span className="text-slate-500 font-medium block mb-1">
              Admin Notes:
            </span>
            <div className="bg-slate-50 p-2 rounded-lg text-slate-600 italic border border-slate-100">
              {redemption.admin_notes || 'No internal notes provided.'}
            </div>
          </div>
        </div>

        {stripeRefundUrl ? (
          <a
            href={stripeRefundUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Open Stripe Dashboard &rarr;
          </a>
        ) : (
          <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200 font-medium text-center">
            ⚠️ No Stripe payment information found for this
            shareholder/investment.
          </div>
        )}

        <button
          onClick={handleClose}
          className="mt-4 w-full bg-slate-100 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
