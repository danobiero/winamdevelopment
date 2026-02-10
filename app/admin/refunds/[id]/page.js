import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  getRefundById,
  getActiveRefundRejectionPolicies,
} from '../refund-actions';

import RefundStatusForm from './RefundStatusForm';

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

  const rejectionPolicies = await getActiveRefundRejectionPolicies();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Edit Refund{' '}
          <span className="text-gray-400 font-mono text-xl">#{refund.id}</span>
        </h1>
        <Link
          href="/admin/refunds"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back to Refunds
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Refund Info */}
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
              <span className="font-semibold">{refund.students?.fullName}</span>
            </p>

            <p className="flex justify-between">
              <span className="text-gray-500 font-medium">Amount:</span>
              <span className="text-lg font-bold text-green-700">
                {formatCurrency(refund.refund_amount)}
              </span>
            </p>

            <div>
              <span className="text-gray-500 font-medium block mb-1">
                Reason:
              </span>
              <div className="bg-gray-50 p-3 rounded italic text-gray-700 border">
                {refund.reason || 'No reason provided'}
              </div>
            </div>
          </div>
        </div>

        {/* MANAGEMENT CARD (FORM GOES HERE) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
          <h2 className="text-lg font-bold border-b pb-2">Management</h2>

          <RefundStatusForm
            refund={refund}
            rejectionPolicies={rejectionPolicies}
          />
        </div>
      </div>

      {/* Booking Summary */}
      <div className="bg-gray-50 p-6 rounded-xl border border-dashed">
        <h2 className="text-lg font-bold mb-4">Linked Booking</h2>

        {refund.bookings ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border">
              <span className="text-xs uppercase text-gray-400">Booking</span>
              <div className="font-mono">#{refund.bookings.id}</div>
            </div>

            <div className="bg-white p-3 rounded border">
              <span className="text-xs uppercase text-gray-400">
                Total Price
              </span>
              <div className="font-semibold">
                {formatCurrency(refund.bookings.totalPrice)}
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <span className="text-xs uppercase text-gray-400">Students</span>
              <div className="font-semibold">{refund.bookings.numStudents}</div>
            </div>
          </div>
        ) : (
          <p className="italic text-gray-500">No booking data.</p>
        )}
      </div>
    </div>
  );
}
