import { auth } from '@/app/_lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getRefundById, updateRefundStatus } from '../refund-actions';

export default async function RefundEditPage({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const refundId = params.id;
  const refund = await getRefundById(refundId);

  if (!refund) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Refund Not Found</h1>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Refund #{refund.id}</h1>
        <Link href="/admin/refunds" className="text-blue-600 hover:underline">
          ← Back to Refunds
        </Link>
      </div>

      {/* Refund Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg shadow-sm border">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Refund Information</h2>
          <p>
            <strong>ID:</strong> {refund.id}
          </p>
          <p>
            <strong>Booking ID:</strong> {refund.booking_id}
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
          <p>
            <strong>Updated:</strong>{' '}
            {refund.updated_at
              ? new Date(refund.updated_at).toLocaleString()
              : '—'}
          </p>
        </div>

        {/* Status section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Status</h2>

          <form action={updateRefundStatus} className="space-y-4">
            {/* Reset Refund Status */}

            {/* Hidden ID input */}
            <input type="hidden" name="refundId" value={refund.id} />

            <label className="block">
              <span className="font-medium">Refund Status</span>
              <select
                name="status"
                defaultValue={refund.status ?? 'pending'}
                className="mt-1 w-full border rounded px-3 py-2"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>

            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Update Status
            </button>
          </form>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

        {refund.bookings ? (
          <div className="space-y-2">
            <p>
              <strong>Booking:</strong> #{refund.bookings.id}
            </p>
            <p>
              <strong>Total Price:</strong> ${refund.bookings.totalPrice}
            </p>
            <p>
              <strong>Students:</strong> {refund.bookings.numStudents}
            </p>
            <Link
              href={`/admin/bookings?view=${refund.bookings.id}`}
              className="text-blue-600 hover:underline"
            >
              View Booking
            </Link>
          </div>
        ) : (
          <p>No booking found.</p>
        )}
      </div>
    </div>
  );
}
