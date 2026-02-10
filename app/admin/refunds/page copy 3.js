import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  getRefunds,
  getRefundById,
  updateRefundStatus,
} from './refund-actions';

import RefundViewModal from './RefundViewModal';
import RefundApprovedModalWrapper from './RefundApprovedModalWrapper';
import { createStripeRefundAction } from './refund-actions';

import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

// Helper to format currency consistently
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

export default async function RefundsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const page = Number(searchParams?.page ?? 1);
  const viewId = searchParams?.view || null;
  const approvedId = searchParams?.approved || null;

  let viewedRefund = null;
  let approvedRefund = null;

  if (viewId) viewedRefund = await getRefundById(viewId);
  if (approvedId) approvedRefund = await getRefundById(approvedId);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const refunds = await getRefunds({ from, to });

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Modals */}
      {viewedRefund && <RefundViewModal refund={viewedRefund} />}
      {approvedRefund && (
        <RefundApprovedModalWrapper
          refund={approvedRefund}
          createAction={createStripeRefundAction}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between py-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Refund Requests
        </h1>
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {refunds.map((ref) => (
          <div
            key={ref.id}
            className="bg-white p-4 rounded-lg border shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-gray-500 font-mono uppercase">
                  ID: {ref.id}
                </p>
                <Link
                  href={`/admin/bookings?view=${ref.booking_id}`}
                  className="text-sm text-blue-600 font-bold hover:underline"
                >
                  Booking #{ref.booking_id}
                </Link>
              </div>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  ref.status === 'approved'
                    ? 'bg-green-100 text-green-700'
                    : ref.status === 'completed'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {ref.status || 'pending'}
              </span>
            </div>

            <div className="text-sm space-y-1">
              <p className="font-semibold">
                {ref.students?.fullName || 'Unknown Student'}
              </p>
              <p className="text-gray-600 text-xs italic line-clamp-2">
                "{ref.reason || 'No reason provided'}"
              </p>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-gray-400">
                  {new Date(ref.updated_at).toLocaleDateString()}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(ref.refund_amount ?? 0)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Link
                href={`/admin/refunds?view=${ref.id}&page=${page}`}
                className="flex-1 text-center py-2 bg-blue-50 text-blue-600 rounded-md text-xs font-bold border border-blue-100"
              >
                VIEW
              </Link>

              {ref.status === 'pending' ? (
                <>
                  <Link
                    href={`/admin/refunds/${ref.id}`}
                    className="flex-1 text-center py-2 bg-green-50 text-green-600 rounded-md text-xs font-bold border border-green-100"
                  >
                    EDIT
                  </Link>
                  <form action={updateRefundStatus} className="flex-1">
                    <input type="hidden" name="refundId" value={ref.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button
                      type="submit"
                      className="w-full text-center py-2 bg-green-600 text-white rounded-md text-xs font-bold uppercase shadow-sm"
                    >
                      Approve
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 text-center py-2 bg-gray-50 text-gray-400 rounded-md text-xs font-bold border border-gray-100 uppercase">
                  Closed
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden md:block rounded-lg border shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Booking</th>
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Reason</th>
                <th className="p-4 font-semibold">Updated</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {refunds.map((ref, index) => (
                <tr
                  key={ref.id}
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                >
                  <td className="p-4 text-xs font-mono text-gray-500">
                    {ref.id}
                  </td>
                  <td className="p-4 text-blue-600 font-medium">
                    <Link
                      href={`/admin/bookings?view=${ref.booking_id}`}
                      className="hover:underline"
                    >
                      #{ref.booking_id}
                    </Link>
                  </td>
                  <td className="p-4">{ref.students?.fullName || 'Unknown'}</td>
                  <td className="p-4 font-bold text-gray-900">
                    {formatCurrency(ref.refund_amount ?? 0)}
                  </td>
                  <td className="p-4 truncate max-w-[200px] text-gray-500">
                    {ref.reason || '—'}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {ref.updated_at
                      ? new Date(ref.updated_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        ref.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : ref.status === 'completed'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {ref.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <Link
                        href={`/admin/refunds?view=${ref.id}&page=${page}`}
                        className="text-blue-600 font-bold hover:underline uppercase"
                      >
                        View
                      </Link>
                      <span className="text-gray-300">|</span>
                      {ref.status === 'pending' ? (
                        <>
                          <Link
                            href={`/admin/refunds/${ref.id}`}
                            className="text-green-600 font-bold hover:underline uppercase"
                          >
                            Edit
                          </Link>
                          <span className="text-gray-300">|</span>
                          <form action={updateRefundStatus}>
                            <input
                              type="hidden"
                              name="refundId"
                              value={ref.id}
                            />
                            <input
                              type="hidden"
                              name="status"
                              value="approved"
                            />
                            <button
                              type="submit"
                              className="bg-green-600 text-white px-3 py-1 rounded font-bold hover:bg-green-700 transition-colors shadow-sm"
                            >
                              APPROVE
                            </button>
                          </form>
                        </>
                      ) : (
                        <span className="text-gray-400 font-bold uppercase tracking-tighter">
                          Closed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls page={page} hasNext={refunds.length === PAGE_SIZE} />
    </div>
  );
}
