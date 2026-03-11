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

  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;
  const refundId = params?.refund || null;

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
    <div className="min-h-screen space-y-6 px-3 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Modals */}
      {viewedBooking && <ViewBookingModal booking={viewedBooking} />}
      {viewedRefund && (
        <BookingRefundViewModal refund={viewedRefund} ledger={refundLedger} />
      )}

      {/* Header & Status Key */}
      <div className="flex flex-col gap-6 border-b border-slate-100 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Bookings <span className="text-blue-600">Inbox</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            {bookings.length} Total Records
          </div>
        </div>

        {/* STATUS KEY / LEGEND */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Status Key:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-slate-600">Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-violet-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Refund Pending
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Cancelled
            </span>
          </div>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {bookings.map((booking) => {
          const activeRefund = booking.refunds?.find(
            (r) => r.status?.toLowerCase().trim() !== 'completed'
          );
          const hasActiveRefund = Boolean(activeRefund);

          return (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-[9px] font-mono text-slate-400 font-bold">
                  #{booking.id}
                </span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(booking.totalPrice ?? 0)}
                </span>
              </div>

              <div className="w-full">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Lesson
                </p>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {booking.lessons?.name}
                </h3>
              </div>

              <div className="w-full">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Client
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {booking.students?.fullName || 'Unknown Client'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Status
                  </p>
                  <StatusBadge
                    booking={booking}
                    hasActiveRefund={hasActiveRefund}
                  />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Schedule
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-slate-600">
                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      Start: {formatDate(booking.startDate)}
                    </span>
                    <span className="text-slate-300">→</span>
                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                      End: {formatDate(booking.endDate)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-slate-50">
                <Link
                  href={`/admin/bookings?view=${booking.id}&page=${page}`}
                  className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                >
                  View Details
                </Link>
                {!booking.cancelled && (
                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="px-3 py-2 bg-white border border-slate-200 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                  >
                    Edit Booking
                  </Link>
                )}
                {hasActiveRefund && (
                  <Link
                    href={`/admin/bookings?refund=${activeRefund.id}&page=${page}`}
                    className="px-3 py-2 bg-violet-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
                  >
                    Process Refund
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                ID
              </th>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Lesson
              </th>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Client
              </th>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Schedule
              </th>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Total
              </th>
              <th className="px-6 py-4 text-right font-black text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => {
              const activeRefund = booking.refunds?.find(
                (r) => r.status?.toLowerCase().trim() !== 'completed'
              );
              const hasActiveRefund = Boolean(activeRefund);

              return (
                <tr
                  key={booking.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-bold">
                    #{booking.id}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {booking.lessons?.name}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">
                    {booking.students?.fullName || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-semibold">
                    <div className="flex flex-col">
                      <span>{formatDate(booking.startDate)}</span>
                      <span className="text-[10px] text-slate-300">to</span>
                      <span>{formatDate(booking.endDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-slate-900">
                    {formatCurrency(booking.totalPrice ?? 0)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap max-w-[200px] ml-auto">
                      <Link
                        href={`/admin/bookings?view=${booking.id}&page=${page}`}
                        className="text-blue-600 hover:underline font-bold uppercase text-[10px]"
                      >
                        View
                      </Link>
                      {!booking.cancelled && (
                        <>
                          <span className="text-slate-200">|</span>
                          <Link
                            href={`/admin/bookings/${booking.id}`}
                            className="text-orange-500 hover:underline font-bold uppercase text-[10px]"
                          >
                            Edit
                          </Link>
                        </>
                      )}
                      {hasActiveRefund && (
                        <Link
                          href={`/admin/bookings?refund=${activeRefund.id}&page=${page}`}
                          className="ml-2 bg-violet-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase"
                        >
                          Refund
                        </Link>
                      )}
                      <StatusIndicator
                        booking={booking}
                        hasActiveRefund={hasActiveRefund}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-4">
        <PaginationControls
          page={page}
          hasNext={bookings.length === PAGE_SIZE}
        />
      </div>
    </div>
  );
}

function StatusBadge({ booking, hasActiveRefund }) {
  if (booking.cancelled)
    return (
      <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
        Cancelled
      </span>
    );
  if (hasActiveRefund)
    return (
      <span className="text-[9px] font-black uppercase tracking-widest text-violet-600 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded">
        Refund Pending
      </span>
    );
  return (
    <span className="text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded">
      Active
    </span>
  );
}

function StatusIndicator({ booking, hasActiveRefund }) {
  const statusLabel = booking.cancelled
    ? 'Cancelled'
    : hasActiveRefund
      ? 'Refund Pending'
      : 'Active';
  const color = booking.cancelled
    ? 'bg-red-500'
    : hasActiveRefund
      ? 'bg-violet-500'
      : 'bg-green-500';

  return (
    <div
      className={`h-2 w-2 rounded-full ${color} cursor-help transition-transform hover:scale-125`}
      title={`Status: ${statusLabel}`}
    />
  );
}
