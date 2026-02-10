import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getBookings, getBookingById, getBookingLedger } from './actions';
import { getRefundById } from '../refunds/refund-actions';

import ViewBookingModal from './ViewBookingModal';
import BookingRefundViewModal from './RefundViewModal';

import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

// Helper to format currency consistently
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

// Timezone-aware date formatter: Brief Month (e.g., Jan 24, 2026)
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

  // Since getBookingById includes refunds(*), viewedBooking will have the refund data

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
    <div className="space-y-6 px-4 sm:px-0">
      {viewedBooking && <ViewBookingModal booking={viewedBooking} />}
      {viewedRefund && (
        <BookingRefundViewModal refund={viewedRefund} ledger={refundLedger} />
      )}

      <div className="flex items-center justify-between py-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Bookings</h1>
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
              className="bg-white p-4 rounded-lg border shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 font-mono">
                    #{booking.id}
                  </p>
                  <h3 className="font-bold text-lg">{booking.lessons?.name}</h3>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    booking.isPaid
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {booking.isPaid ? 'Paid' : 'Unpaid'}
                </span>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-500">Client:</span>{' '}
                  {booking.students?.fullName || 'Unknown'}
                </p>
                <p>
                  <span className="text-gray-500">Total:</span>{' '}
                  {formatCurrency(booking.totalPrice ?? 0)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(booking.startDate)} to{' '}
                  {formatDate(booking.endDate)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-3 border-t">
                <Link
                  href={`/admin/bookings?view=${booking.id}&page=${page}`}
                  className="flex-1 min-w-[80px] text-center py-2 bg-blue-50 text-blue-600 rounded-md text-xs font-bold border border-blue-100"
                >
                  VIEW
                </Link>

                {booking.cancelled ? (
                  <div className="flex-1 min-w-[80px] text-center py-2 bg-red-50 text-red-600 rounded-md text-xs font-bold border border-red-100">
                    CANCELLED
                  </div>
                ) : (
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="flex-1 min-w-[80px] text-center py-2 bg-green-50 text-green-600 rounded-md text-xs font-bold border border-green-100"
                  >
                    EDIT
                  </Link>
                )}

                <div className="flex-1 min-w-[80px] flex items-center justify-center">
                  {hasActiveRefund ? (
                    <Link
                      href={`/admin/bookings?refund=${activeRefund.id}&page=${page}`}
                      className="w-full text-center py-2 bg-purple-50 text-purple-700 rounded-md text-xs font-bold border border-purple-100"
                    >
                      REFUNDS
                    </Link>
                  ) : booking.cancelled ? (
                    <div className="w-full text-center py-2 bg-gray-100 text-gray-500 rounded-md text-xs font-bold border border-gray-200">
                      SETTLED
                    </div>
                  ) : (
                    <div className="w-full text-center py-2 bg-gray-50 text-gray-400 rounded-md text-xs font-bold border border-gray-100">
                      ACTIVE
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden md:block rounded-lg border shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Lesson</th>
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold">Dates</th>
                <th className="p-4 font-semibold">Total</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking, index) => {
                const activeRefund = booking.refunds?.find((r) => {
                  const status = r.status?.toLowerCase().trim();
                  return status && status !== 'completed';
                });
                const hasActiveRefund = Boolean(activeRefund);

                return (
                  <tr
                    key={booking.id}
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="p-4">{booking.id}</td>
                    <td className="p-4 font-semibold">
                      {booking.lessons?.name}
                    </td>
                    <td className="p-4">
                      {booking.students?.fullName || 'Unknown'}
                    </td>
                    <td className="p-4 text-xs whitespace-nowrap">
                      {formatDate(booking.startDate)} -{' '}
                      {formatDate(booking.endDate)}
                    </td>
                    <td className="p-4 font-medium">
                      {formatCurrency(booking.totalPrice ?? 0)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/bookings?view=${booking.id}&page=${page}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
                        <span className="text-gray-400">|</span>
                        {booking.cancelled ? (
                          <span className="text-red-600 font-semibold italic text-xs">
                            Cancelled
                          </span>
                        ) : (
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="text-green-600 hover:underline"
                          >
                            Edit
                          </Link>
                        )}
                        <span className="text-gray-400">|</span>

                        {hasActiveRefund ? (
                          <Link
                            href={`/admin/bookings?refund=${activeRefund.id}&page=${page}`}
                            className="text-purple-700 font-bold hover:underline"
                          >
                            Refunds
                          </Link>
                        ) : booking.cancelled ? (
                          <span className="text-gray-400 font-bold text-xs uppercase bg-gray-100 px-2 py-1 rounded">
                            Settled
                          </span>
                        ) : (
                          <span className="text-gray-300 italic">Active</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls page={page} hasNext={bookings.length === PAGE_SIZE} />
    </div>
  );
}
