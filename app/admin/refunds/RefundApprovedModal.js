'use client';

export default function RefundApprovedModal({ refund }) {
  const latestPayment = refund.payments?.length
    ? refund.payments.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )[0]
    : null;

  console.log(latestPayment);

  const payment = refund.latestPayment;
  const paymentIntent = latestPayment.stripe_payment_intent_id;
  const chargeId = latestPayment.stripe_charge_id;

  const amountCents = Math.round((refund.refund_amount ?? 0) * 100);

  // Determine test or live mode
  const isTestMode =
    (paymentIntent &&
      paymentIntent.startsWith('pi_') &&
      (paymentIntent.includes('test') || paymentIntent.includes('pi_test'))) ||
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[420px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-green-700">
          Refund Approved
        </h2>

        <div className="space-y-2 mb-4">
          <p>
            <strong>Refund ID:</strong> {refund.id}
          </p>
          <p>
            <strong>Booking:</strong> #{refund.booking_id}
          </p>
          <p>
            <strong>Student:</strong> {refund.students?.fullName}
          </p>
          <p>
            <strong>Amount:</strong> ${refund.refund_amount?.toFixed(2)}
          </p>
          <p>
            <strong>Reason:</strong> {refund.reason || '—'}
          </p>
        </div>

        <hr className="my-3" />

        {stripeRefundUrl ? (
          <a
            href={stripeRefundUrl}
            target="_blank"
            className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Open Stripe Refund Page
          </a>
        ) : (
          <div className="p-3 bg-yellow-100 text-yellow-800 rounded">
            ⚠️ No Stripe payment information found for this booking.
          </div>
        )}

        <button
          onClick={() => (window.location.href = '/admin/refunds')}
          className="mt-4 w-full bg-gray-200 py-2 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
