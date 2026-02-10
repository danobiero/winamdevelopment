'use client';

export default function PaymentViewModal({ payment }) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[450px] max-h-[85vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-primary-900">
          Payment #{payment.id}
        </h2>

        <div className="space-y-2">
          <p>
            <strong>Amount:</strong> ${payment.amount}
          </p>
          <p>
            <strong>Status:</strong> {payment.status}
          </p>
          <p>
            <strong>Booking:</strong> #{payment.booking_id}
          </p>
          <p>
            <strong>Client:</strong> {payment.students?.fullName}
          </p>
          <p>
            <strong>Created:</strong>{' '}
            {new Date(payment.created_at).toLocaleString()}
          </p>

          {payment.receipt_url && (
            <a
              href={payment.receipt_url}
              target="_blank"
              className="text-blue-600 underline"
            >
              View Receipt
            </a>
          )}

          <div className="text-sm mt-3">
            <strong>Description:</strong>
            <p className="text-gray-700">{payment.description || '—'}</p>
          </div>
        </div>

        <button
          onClick={() => (window.location.href = '/admin/payments')}
          className="mt-6 w-full bg-gray-200 py-2 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}
