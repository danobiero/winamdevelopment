import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  getRefunds,
  getRefundById,
  getBookingLedger,
  createStripeRefundAction,
} from './refund-actions';

import RefundViewModal from './RefundViewModal';
import RefundApprovedModalWrapper from './RefundApprovedModalWrapper';

import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0);

export default async function RefundsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;
  const approvedId = params?.approved || null;

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
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] mx-auto h-full">
      {/* Modals */}
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

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Refund <span className="text-blue-600">Requests</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            {refunds.length} Total Records
          </div>
        </div>

        {/* STATUS KEY / LEGEND */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Status Key:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Pending
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Approved
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Completed
            </span>
          </div>
        </div>
      </div>

      {/* --- MOBILE CARD VIEW (Mirrors Booking Layout) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {refunds.map((ref) => (
          <div
            key={ref.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[9px] font-mono text-slate-400 font-bold">
                #{String(ref.id).slice(0, 8)}
              </span>
              <span className="text-sm font-black text-slate-900">
                {formatCurrency(ref.refund_amount)}
              </span>
            </div>

            <div className="w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Linked Booking
              </p>
              <Link
                href={`/admin/bookings?view=${ref.booking_id}`}
                className="text-sm font-bold text-blue-600 hover:underline leading-snug"
              >
                Booking #{ref.booking_id}
              </Link>
            </div>

            <div className="w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Client
              </p>
              <p className="text-sm font-medium text-slate-700">
                {ref.students?.fullName || 'Unknown Client'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Status
                </p>
                <StatusBadge status={ref.status} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-slate-50">
              <Link
                href={`/admin/refunds?view=${ref.id}&page=${page}`}
                className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
              >
                View Details
              </Link>
              {ref.status === 'pending' && (
                <Link
                  href={`/admin/refunds?approved=${ref.id}&page=${page}`}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-md active:scale-95 transition-all"
                >
                  Approve Refund
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100 text-xs table-fixed">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-24 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                ID
              </th>
              <th className="w-32 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Booking
              </th>
              <th className="px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Client
              </th>
              <th className="w-32 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Amount
              </th>
              <th className="w-40 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Status
              </th>
              <th className="w-48 px-4 py-4 text-right font-black text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {refunds.map((ref) => (
              <tr
                key={ref.id}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="px-4 py-4 font-mono text-[10px] text-slate-400 font-bold truncate">
                  #{String(ref.id).slice(0, 8)}
                </td>
                <td className="px-4 py-4">
                  <Link
                    href={`/admin/bookings?view=${ref.booking_id}`}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    #{ref.booking_id}
                  </Link>
                </td>
                <td className="px-4 py-4 font-bold text-slate-900 truncate">
                  {ref.students?.fullName}
                </td>
                <td className="px-4 py-4 font-black text-slate-900">
                  {formatCurrency(ref.refund_amount)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={ref.status} />
                    <StatusBadge status={ref.status} />
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end items-center gap-3">
                    <Link
                      href={`/admin/refunds?view=${ref.id}&page=${page}`}
                      className="text-blue-600 hover:underline font-bold uppercase text-[10px]"
                    >
                      View
                    </Link>
                    {ref.status === 'pending' && (
                      <>
                        <span className="text-slate-200">|</span>
                        <Link
                          href={`/admin/refunds?approved=${ref.id}&page=${page}`}
                          className="bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase shadow-sm"
                        >
                          Approve
                        </Link>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2 pb-8">
        <PaginationControls
          page={page}
          hasNext={refunds.length === PAGE_SIZE}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    approved: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    completed: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    pending: 'text-amber-600 bg-amber-50 border-amber-100',
    rejected: 'text-red-600 bg-red-50 border-red-100',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}
    >
      {status || 'pending'}
    </span>
  );
}

function StatusIndicator({ status }) {
  const colors = {
    approved: 'bg-emerald-500',
    completed: 'bg-indigo-500',
    pending: 'bg-amber-500',
    rejected: 'bg-red-500',
  };

  return (
    <div
      className={`h-2 w-2 rounded-full ${colors[status] || colors.pending} cursor-help transition-transform hover:scale-125`}
      title={`Status: ${status}`}
    />
  );
}
