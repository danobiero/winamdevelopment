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
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-6 border-b border-slate-100 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Refund <span className="text-blue-600">Requests</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            Displaying {refunds.length} Results
          </div>
        </div>
      </div>

      {/* --- 6. MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {refunds.map((ref) => (
          <div
            key={ref.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                #{String(ref.id).slice(0, 8)}
              </span>
              <StatusBadge status={ref.status} />
            </div>

            <div>
              <Link
                href={`/admin/bookings?view=${ref.booking_id}`}
                className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors"
              >
                Booking #{ref.booking_id}
              </Link>
              <p className="text-lg font-black text-slate-900 leading-tight">
                {ref.students?.fullName || 'Unknown Student'}
              </p>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-50">
              <div className="text-xl font-black text-[#000033]">
                {formatCurrency(ref.refund_amount)}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/refunds?view=${ref.id}&page=${page}`}
                  className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-200 transition-all"
                >
                  View
                </Link>
                {ref.status === 'pending' && (
                  <Link
                    href={`/admin/refunds?approved=${ref.id}&page=${page}`}
                    className="px-4 py-2 bg-[#000033] text-white rounded-xl text-[10px] font-black uppercase shadow-md active:scale-95 transition-all"
                  >
                    Approve
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- 7. DESKTOP TABLE VIEW --- */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  ID
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Booking
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Client
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {refunds.map((ref) => (
                <tr
                  key={ref.id}
                  className="hover:bg-blue-50/40 transition-colors group"
                >
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-bold">
                    #{String(ref.id).slice(0, 8)}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/bookings?view=${ref.booking_id}`}
                      className="text-blue-600 font-bold text-[13px] hover:underline"
                    >
                      #{ref.booking_id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-[13px] font-bold text-slate-700">
                    {ref.students?.fullName}
                  </td>
                  <td className="px-6 py-4 text-[15px] font-black text-[#000033]">
                    {formatCurrency(ref.refund_amount)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ref.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <Link
                        href={`/admin/refunds?view=${ref.id}&page=${page}`}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        View
                      </Link>
                      {ref.status === 'pending' && (
                        <>
                          <div className="w-px h-3 bg-slate-200" />
                          <Link
                            href={`/admin/refunds/${ref.id}`}
                            className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            Edit
                          </Link>
                          <div className="w-px h-3 bg-slate-200" />
                          <Link
                            href={`/admin/refunds?approved=${ref.id}&page=${page}`}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
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
      </div>

      {/* 8. Footer Pagination */}
      <div className="pt-4">
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
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    completed: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    rejected: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}
    >
      {status || 'pending'}
    </span>
  );
}
