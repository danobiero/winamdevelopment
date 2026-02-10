import { auth } from '@/app/_lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getRefundById, updateRefundStatus } from '../refund-actions';

// Helper to format currency consistently
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0);

export default async function RefundEditPage({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const refundId = params.id;
  const refund = await getRefundById(refundId);

  if (!refund) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-red-600">Refund Not Found</h1>
        <Link
          href="/admin/refunds"
          className="text-blue-600 hover:underline mt-4 block"
        >
          ← Back to Refunds
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Refund Review{' '}
          <span className="text-gray-400 font-mono text-xl">#{refund.id}</span>
        </h1>
        <Link
          href="/admin/refunds"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">
            ←
          </span>
          Back to Refunds
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Refund Information Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">
            Refund Information
          </h2>

          <div className="space-y-3 text-sm">
            <p className="flex justify-between">
              <span className="text-gray-500 font-medium">Booking ID:</span>
              <span className="font-mono">#{refund.booking_id}</span>
            </p>

            <p className="flex justify-between">
              <span className="text-gray-500 font-medium">Student:</span>
              <span className="font-semibold text-gray-900">
                {refund.students?.fullName}
              </span>
            </p>

            <p className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Amount:</span>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(refund.refund_amount)}
              </span>
            </p>

            <div className="pt-2">
              <span className="text-gray-500 font-medium block mb-1">
                Reason:
              </span>
              <div className="bg-gray-50 p-3 rounded italic text-gray-700 border border-gray-100">
                {refund.reason || 'No reason provided.'}
              </div>
            </div>

            <p className="text-[10px] text-gray-400 pt-2 italic">
              Last updated:{' '}
              {refund.updated_at
                ? new Date(refund.updated_at).toLocaleString()
                : '—'}
            </p>
          </div>
        </div>

        {/* Management Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Management</h2>

          {/* Pending */}
          {refund.status === 'pending' && (
            <div className="space-y-3">
              <Link
                href={`/admin/refunds?approved=${refund.id}`}
                className="w-full inline-flex justify-center items-center
                           bg-green-600 hover:bg-green-700
                           text-white font-bold py-3 px-4 rounded-lg
                           shadow-sm transition-all active:scale-[0.98]"
              >
                Approve & Issue Refund
              </Link>

              <form action={updateRefundStatus}>
                <input type="hidden" name="refundId" value={refund.id} />
                <input type="hidden" name="status" value="rejected" />
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center
                             bg-red-100 hover:bg-red-200
                             text-red-700 font-bold py-3 px-4 rounded-lg
                             border border-red-200 transition-all"
                >
                  Reject Refund
                </button>
              </form>
            </div>
          )}

          {/* Approved but not executed yet */}
          {refund.status === 'approved' && (
            <Link
              href={`/admin/refunds?approved=${refund.id}`}
              className="w-full inline-flex justify-center items-center
                         bg-blue-600 hover:bg-blue-700
                         text-white font-bold py-3 px-4 rounded-lg
                         shadow-sm transition-all"
            >
              Continue Refund
            </Link>
          )}

          {/* Completed / Rejected */}
          {(refund.status === 'completed' || refund.status === 'rejected') && (
            <div className="p-3 bg-gray-100 rounded text-sm text-gray-600 text-center">
              Refund is <strong className="uppercase">{refund.status}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Booking Summary Card */}
      <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Linked Booking Details
          </h2>

          {refund.bookings && (
            <Link
              href={`/admin/bookings?view=${refund.bookings.id}`}
              className="text-xs font-bold uppercase tracking-wider
                         bg-white border px-3 py-1 rounded
                         shadow-sm hover:bg-gray-50"
            >
              View Full Booking
            </Link>
          )}
        </div>

        {refund.bookings ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <span className="text-gray-400 block text-xs uppercase font-bold">
                Booking ID
              </span>
              <span className="font-mono text-gray-900">
                #{refund.bookings.id}
              </span>
            </div>

            <div className="bg-white p-3 rounded border">
              <span className="text-gray-400 block text-xs uppercase font-bold">
                Total Price
              </span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(refund.bookings.totalPrice)}
              </span>
            </div>

            <div className="bg-white p-3 rounded border">
              <span className="text-gray-400 block text-xs uppercase font-bold">
                Student Count
              </span>
              <span className="font-semibold text-gray-900">
                {refund.bookings.numStudents} Students
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 italic">No linked booking data found.</p>
        )}
      </div>
    </div>
  );
}
