import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getPayments, getPaymentById } from './payment-actions';
import PaymentViewModal from './PaymentViewModal';
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

export default async function PaymentsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;

  let viewedPayment = null;
  if (viewId) viewedPayment = await getPaymentById(viewId);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const payments = await getPayments({ from, to });

  return (
    <div className="min-h-screen space-y-6 px-3 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {viewedPayment && <PaymentViewModal payment={viewedPayment} />}

      {/* Header */}
      <div className="flex flex-col gap-6 border-b border-slate-100 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payments <span className="text-blue-600">Ledger</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            {payments.length} Records
          </div>
        </div>

        {/* Status Key */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Payment Status:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Succeeded
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Refunded
            </span>
          </div>
        </div>
      </div>

      {/* --- CARD VIEW (Used for Mobile, Tablet, and Large Split Screens) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {payments.map((pay) => (
          <div
            key={pay.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[9px] font-mono text-slate-400 font-bold">
                ID: {pay.id?.slice(0, 8)}...
              </span>
              <span className="text-lg font-black text-slate-900">
                {formatCurrency(pay.amount)}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Client
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                {pay.students?.fullName || 'Unknown Student'}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Booking
                </p>
                <Link
                  href={`/admin/bookings?view=${pay.booking_id}`}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  #{pay.booking_id}
                </Link>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Status
                </p>
                <PaymentStatusBadge pay={pay} />
              </div>
            </div>
            <div className="pt-4 mt-auto border-t border-slate-50">
              <Link
                href={`/admin/payments?view=${pay.id}&page=${page}`}
                className="block w-full text-center py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* --- TABLE VIEW (Only for Full Desktop) --- */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                ID
              </th>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Booking
              </th>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Client
              </th>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Amount
              </th>
              <th className="px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 text-right font-black text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.map((pay) => (
              <tr
                key={pay.id}
                className="hover:bg-blue-50/30 transition-colors"
              >
                <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-bold truncate max-w-[100px]">
                  {pay.id}
                </td>
                <td className="px-6 py-4 font-bold text-blue-600">
                  <Link href={`/admin/bookings?view=${pay.booking_id}`}>
                    #{pay.booking_id}
                  </Link>
                </td>
                <td className="px-6 py-4 font-medium text-slate-700">
                  {pay.students?.fullName}
                </td>
                <td className="px-6 py-4 font-black text-slate-900">
                  {formatCurrency(pay.amount)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <PaymentStatusIndicator pay={pay} />
                    <span className="font-bold text-slate-600 capitalize">
                      {pay.refunded ? 'Refunded' : pay.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/payments?view=${pay.id}&page=${page}`}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-600 hover:border-slate-900"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Wrapper: This forces the left/right snap */}
      <div className="pt-8 pb-10 w-full">
         <div className="pt-4">
               <PaginationControls
                 page={page}
                 hasNext={payments.length === PAGE_SIZE}
               />
             </div>
      </div>
    </div>
  );
}

function PaymentStatusBadge({ pay }) {
  const styles = pay.refunded
    ? 'text-rose-600 bg-rose-50 border-rose-100'
    : 'text-emerald-600 bg-emerald-50 border-emerald-100';
  return (
    <span
      className={`text-[9px] font-black uppercase tracking-widest border px-2 py-0.5 rounded ${styles}`}
    >
      {pay.refunded ? 'Refunded' : pay.status}
    </span>
  );
}

function PaymentStatusIndicator({ pay }) {
  const color = pay.refunded ? 'bg-rose-500' : 'bg-emerald-500';
  return <div className={`h-2 w-2 rounded-full ${color}`} />;
}
