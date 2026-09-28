import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getPayments, getPaymentById, getPaymentModeAction } from './payment-actions';
import { getOpportunities } from '../opportunities/actions';
import PaymentViewModal from './PaymentViewModal';
import PaymentModeToggle from './PaymentModeToggle';
import PaginationControls from '@/app/_components/PaginationControls';
import FilterPanel from '@/app/_components/FilterPanel';

const PAGE_SIZE = 10;

/* =========================
   HELPERS
========================= */

const formatCurrency = (value, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(Number(value || 0));

const formatDate = (dateString) => {
  if (!dateString) return '—';

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/* =========================
   STATUS NORMALIZER
========================= */

function getPaymentStatus(status) {
  const s = (status || '').toLowerCase().trim();

  if (['succeeded', 'success', 'paid', 'complete', 'completed'].includes(s)) {
    return 'success';
  }

  if (['failed', 'canceled', 'cancelled', 'error'].includes(s)) {
    return 'failed';
  }

  if (['pending', 'processing', 'incomplete'].includes(s)) {
    return 'pending';
  }

  return 'unknown';
}

/* =========================
   PAGE
========================= */

export default async function PaymentsPage({ searchParams }) {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const params = await searchParams;

  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;
  const searchShareholder = params?.searchShareholder || null;
  const filterOpportunity = params?.filterOpportunity || null;
  const startDate = params?.startDate || null;
  const endDate = params?.endDate || null;

  let viewedPayment = null;

  if (viewId) {
    viewedPayment = await getPaymentById(viewId);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [payments, opportunities, paymentMode] = await Promise.all([
    getPayments({
      from,
      to,
      searchShareholder,
      filterOpportunity,
      startDate,
      endDate,
    }),
    getOpportunities(),
    getPaymentModeAction(),
  ]);

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] mx-auto h-full">
      {viewedPayment && <PaymentViewModal payment={viewedPayment} />}

      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payments <span className="text-blue-600">Ledger</span>
          </h1>

          <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            {payments.length} Records
          </div>
        </div>
      </div>

      {/* PAYMENT GATEWAY CONTROL */}
      <PaymentModeToggle initialMode={paymentMode} />

      <FilterPanel
        basePath="/admin/payments"
        opportunities={opportunities}
        showDateRange={true}
        initialSearchValue={searchShareholder || ''}
        initialFilterOpportunity={filterOpportunity || ''}
        initialStartDate={startDate || ''}
        initialEndDate={endDate || ''}
      />

      {/* MOBILE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {payments.map((pay) => {
          const status = getPaymentStatus(pay.status);

          return (
            <div
              key={pay.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <span className="text-xs font-mono text-slate-400 font-bold">
                  ID: {pay.id?.slice(0, 8)}...
                </span>

                <span className="text-lg font-black text-slate-900">
                  {formatCurrency(pay.amount, pay.currency)}
                </span>
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                  Shareholder
                </p>

                <h3 className="text-sm font-bold text-slate-900">
                  {pay.shareholders?.fullName || 'Unknown Shareholder'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Opportunity
                  </p>

                  <div className="text-xs font-bold text-blue-600">
                    {pay.opportunities?.name || 'N/A'}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                    Status
                  </p>

                  <PaymentStatusBadge status={status} raw={pay.status} />
                </div>
              </div>

              <div className="pt-4 mt-auto border-t border-slate-50 flex gap-2">
                {status === 'pending' ? (
                  <>
                    <Link
                      href={`/admin/payments?view=${pay.id}&page=${page}`}
                      className="flex-1 text-center py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition"
                    >
                      Confirm Payment
                    </Link>
                    <Link
                      href={`/admin/payments?view=${pay.id}&page=${page}`}
                      className="px-4 text-center py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition"
                    >
                      Details
                    </Link>
                  </>
                ) : (
                  <Link
                    href={`/admin/payments?view=${pay.id}&page=${page}`}
                    className="block w-full text-center py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest"
                  >
                    Details
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="min-w-[850px] w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Payment ID
              </th>

              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Shareholder
              </th>

              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Opportunity
              </th>

              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Amount
              </th>

              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Status
              </th>

              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Date
              </th>

              {/* ✅ RESTORED ACTIONS COLUMN */}
              <th className="px-6 py-4 text-right font-black text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {payments.map((pay) => {
              const status = getPaymentStatus(pay.status);

              return (
                <tr key={pay.id} className="hover:bg-blue-50/30">
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {pay.id}
                  </td>

                  <td className="px-6 py-4 font-semibold text-slate-800">
                    {pay.shareholders?.fullName}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {pay.opportunities?.name}
                  </td>

                  <td className="px-6 py-4 font-black text-slate-900">
                    {formatCurrency(pay.amount, pay.currency)}
                  </td>

                  <td className="px-6 py-4 flex items-center gap-2">
                    <PaymentStatusIndicator status={status} />
                    <span className="capitalize font-semibold text-slate-600">
                      {pay.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {formatDate(pay.created_at)}
                  </td>

                  {/* ✅ ACTIONS COLUMN */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {status === 'pending' && (
                        <Link
                          href={`/admin/payments?view=${pay.id}&page=${page}`}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                        >
                          Confirm
                        </Link>
                      )}
                      <Link
                        href={`/admin/payments?view=${pay.id}&page=${page}`}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black uppercase text-slate-600 hover:border-slate-900 transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-2 pb-8">
        <PaginationControls
          page={page}
          hasNext={payments.length === PAGE_SIZE}
        />
      </div>
    </div>
  );
}

/* =========================
   UI COMPONENTS
========================= */

function PaymentStatusBadge({ status, raw }) {
  const map = {
    success: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    pending: 'text-amber-600 bg-amber-50 border-amber-100',
    failed: 'text-rose-600 bg-rose-50 border-rose-100',
    unknown: 'text-slate-600 bg-slate-50 border-slate-100',
  };

  return (
    <span
      className={`text-xs font-black uppercase tracking-widest border px-2 py-0.5 rounded ${map[status]}`}
    >
      {raw}
    </span>
  );
}

function PaymentStatusIndicator({ status }) {
  const map = {
    success: 'bg-emerald-500',
    pending: 'bg-amber-500',
    failed: 'bg-rose-500',
    unknown: 'bg-slate-400',
  };

  return <div className={`h-2 w-2 rounded-full ${map[status]}`} />;
}
