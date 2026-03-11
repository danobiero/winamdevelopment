import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getRefunds, getRefundById, getBookingLedger } from './refund-actions';

import RefundViewModal from './RefundViewModal';
import RefundApprovedModalWrapper from './RefundApprovedModalWrapper';
import { createStripeRefundAction } from './refund-actions';

import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

/**
 * Logic: DB stores whole dollar integers (e.g., 10 for $10.00).
 * We format directly for the UI. Stripe conversion (* 100) happens
 * inside the Server Action only.
 */
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0);

export default async function RefundsPage({ searchParams }) {
  // 1. Server-side Authentication
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  // 2. Parse Search Parameters
  const page = Number(searchParams?.page ?? 1);
  const viewId = searchParams?.view || null;
  const approvedId = searchParams?.approved || null;

  // 3. Data Fetching
  let viewedRefund = null;
  let approvedRefund = null;
  let bookingLedger = [];

  if (viewId || approvedId) {
    const refund = viewId
      ? await getRefundById(viewId)
      : await getRefundById(approvedId);

    if (refund?.booking_id) {
      bookingLedger = await getBookingLedger(refund.booking_id);
    }

    if (viewId) viewedRefund = refund;
    if (approvedId) approvedRefund = refund;
  }

  
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const refunds = await getRefunds({ from, to });

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* 4. Modals (Triggered by URL params) */}
      {viewedRefund && (
        <RefundViewModal refund={viewedRefund} ledger={bookingLedger} />
      )}
      {approvedRefund && (
        <RefundApprovedModalWrapper
          refund={approvedRefund}
          ledger={bookingLedger}
          createAction={createStripeRefundAction}
        />
      )}

      {/* 5. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Refund Requests
        </h1>
        <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full w-fit">
          Showing {refunds.length} requests
        </div>
      </div>

      {/* --- 6. MOBILE CARD VIEW (Visible < 768px) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {refunds.map((ref) => (
          <div
            key={ref.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono text-gray-400 uppercase">
                  ID #{ref.id}
                </span>
                <StatusBadge status={ref.status} />
              </div>

              <div>
                <Link
                  href={`/admin/bookings?view=${ref.booking_id}`}
                  className="text-sm font-bold text-blue-600 hover:underline"
                >
                  Booking #{ref.booking_id}
                </Link>
                <p className="font-semibold text-gray-900 leading-tight">
                  {ref.students?.fullName || 'Unknown Student'}
                </p>
              </div>

              <div className="flex justify-between items-end border-t pt-3 mt-1">
                <div className="text-lg font-black text-gray-900">
                  {formatCurrency(ref.refund_amount)}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/refunds?view=${ref.id}&page=${page}`}
                    className="px-3 py-2 bg-gray-50 border rounded-lg text-[10px] font-bold text-gray-600 uppercase"
                  >
                    View
                  </Link>
                  {ref.status === 'pending' && (
                    <>
                      <Link
                        href={`/admin/refunds/${ref.id}`}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-[10px] font-bold text-gray-700 uppercase"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/refunds?approved=${ref.id}&page=${page}`}
                        className="px-3 py-2 bg-green-600 rounded-lg text-[10px] font-bold text-white uppercase shadow-sm"
                      >
                        Approve
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- 7. DESKTOP TABLE VIEW (Visible >= 768px) --- */}
      <div className="hidden md:block rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {refunds.map((ref) => (
                <tr
                  key={ref.id}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">
                    #{ref.id}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/bookings?view=${ref.booking_id}`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      #{ref.booking_id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {ref.students?.fullName}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">
                    {formatCurrency(ref.refund_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ref.status} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link
                      href={`/admin/refunds?view=${ref.id}&page=${page}`}
                      className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase"
                    >
                      View
                    </Link>
                    {ref.status === 'pending' && (
                      <>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/admin/refunds/${ref.id}`}
                          className="text-gray-500 hover:text-gray-700 font-bold text-xs uppercase"
                        >
                          Edit
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link
                          href={`/admin/refunds?approved=${ref.id}&page=${page}`}
                          className="inline-block bg-green-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-green-700 shadow-sm transition-all"
                        >
                          Approve
                        </Link>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 8. Footer Pagination */}
      <PaginationControls page={page} hasNext={refunds.length === PAGE_SIZE} />
    </div>
  );
}

/**
 * Helper Component: Status Badge
 * Isolated for easy styling changes
 */
function StatusBadge({ status }) {
  const styles = {
    approved: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-purple-100 text-purple-700 border-purple-200',
    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-tight ${styles[status] || styles.pending}`}
    >
      {status || 'pending'}
    </span>
  );
}
