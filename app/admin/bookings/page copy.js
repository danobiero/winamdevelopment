import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getBookings, getBookingById, getBookingLedger } from './actions';
import { getRefundById } from '../refunds/refund-actions';

import ViewBookingModal from './ViewBookingModal';
import BookingRefundViewModal from './RefundViewModal';

import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default async function BookingsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const page = Number(searchParams?.page ?? 1);
  const viewId = searchParams?.view || null;
  const refundId = searchParams?.refund || null;

  let viewedBooking = null;
  let viewedRefund = null;
  let refundLedger = [];

  if (refundId) {
    viewedRefund = await getRefundById(refundId);
    refundLedger = await getBookingLedger(viewedRefund.booking_id);
  }

  if (viewId) viewedBooking = await getBookingById(viewId);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const bookings = await getBookings({ from, to });

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Modals */}
      {viewedBooking && <ViewBookingModal booking={viewedBooking} />}
      {viewedRefund && (
        <BookingRefundViewModal refund={viewedRefund} ledger={refundLedger} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Bookings
        </h1>
        <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full w-fit">
          Showing {bookings.length} bookings
        </div>
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {bookings.map((booking) => {
          const activeRefund = booking.refunds?.find((r) => {
            const status = r.status?.toLowerCase().trim();
            return status && status !== 'completed';
          });
          const hasActiveRefund = Boolean(activeRefund);

          return (
            <div
              key={booking.id}
              className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    #{booking.id}
                  </p>
                  <h3 className="font-bold text-gray-900 leading-tight">
                    {booking.lessons?.name}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(booking.totalPrice ?? 0)}
                  </p>
                  {hasActiveRefund && (
                    <span className="inline-block bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-[9px] font-black uppercase mt-1">
                      Has Refund
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50 text-sm">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                    Client
                  </p>
                  <p className="font-medium text-gray-700">
                    {booking.students?.fullName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                    Status
                  </p>
                  {booking.cancelled ? (
                    <span className="text-red-600 font-bold text-xs uppercase">
                      Cancelled
                    </span>
                  ) : hasActiveRefund ? (
                    <span className="text-violet-600 font-bold text-xs uppercase">
                      Refund Pending
                    </span>
                  ) : (
                    <span className="text-green-500 font-bold text-xs uppercase">
                      Active
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
                    Schedule
                  </p>
                  <p className="text-xs font-semibold text-gray-600">
                    {formatDate(booking.startDate)} —{' '}
                    {formatDate(booking.endDate)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/bookings?view=${booking.id}&page=${page}`}
                  className="flex-1 text-center py-2.5 bg-gray-50 text-blue-600 rounded-lg text-xs font-bold uppercase border border-gray-100"
                >
                  View
                </Link>

                {!booking.cancelled && (
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="flex-1 text-center py-2.5 bg-gray-50 text-orange-500 rounded-lg text-xs font-bold uppercase border border-gray-100"
                  >
                    Edit
                  </Link>
                )}

                {hasActiveRefund ? (
                  <Link
                    href={`/admin/bookings?refund=${activeRefund.id}&page=${page}`}
                    className="flex-1 text-center py-2.5 bg-violet-600 text-white rounded-lg text-xs font-bold uppercase shadow-sm"
                  >
                    Refunds
                  </Link>
                ) : (
                  booking.cancelled && (
                    <div className="flex-1 text-center py-2.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold uppercase">
                      Settled
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden md:block rounded-xl border border-gray-200 shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Lesson
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-4 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-4 text-right font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {bookings.map((booking) => {
                const activeRefund = booking.refunds?.find((r) => {
                  const status = r.status?.toLowerCase().trim();
                  return status && status !== 'completed';
                });
                const hasActiveRefund = Boolean(activeRefund);

                return (
                  <tr
                    key={booking.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      #{booking.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {booking.lessons?.name}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      {booking.students?.fullName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 w-[140px] text-[11px] font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                      {formatDate(booking.startDate)} —{' '}
                      {formatDate(booking.endDate)}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {formatCurrency(booking.totalPrice ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <Link
                        href={`/admin/bookings?view=${booking.id}&page=${page}`}
                        className="text-blue-600 hover:text-blue-800 font-bold text-xs uppercase"
                      >
                        View
                      </Link>
                      <span className="text-gray-300">|</span>
                      {booking.cancelled ? (
                        <span className="text-red-600 font-bold text-xs uppercase">
                          Cancelled
                        </span>
                      ) : (
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="text-orange-500 hover:text-gray-700 font-bold text-xs uppercase"
                        >
                          Edit
                        </Link>
                      )}
                      <span className="text-gray-300">|</span>
                      {hasActiveRefund ? (
                        <Link
                          href={`/admin/bookings?refund=${activeRefund.id}&page=${page}`}
                          className="inline-block bg-violet-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-violet-700 shadow-sm transition-all"
                        >
                          Refunds
                        </Link>
                      ) : booking.cancelled ? (
                        <span className="text-gray-500 font-bold text-xs uppercase">
                          Settled
                        </span>
                      ) : (
                        <span className="text-green-500 font-bold text-xs uppercase">
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Pagination */}
      <PaginationControls page={page} hasNext={bookings.length === PAGE_SIZE} />
    </div>
  );
}
