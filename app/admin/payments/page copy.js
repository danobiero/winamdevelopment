import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getPayments, getPaymentById } from './payment-actions';
import PaymentViewModal from './PaymentViewModal';
import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

// Helper to format currency consistently
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

export default async function PaymentsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const page = Number(searchParams?.page ?? 1);
  const viewId = searchParams?.view || null;

  let viewedPayment = null;
  if (viewId) viewedPayment = await getPaymentById(viewId);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const payments = await getPayments({ from, to });

  return (
    <div className="space-y-6 w-full px-4 sm:px-0">
      {/* View Modal */}
      {viewedPayment && <PaymentViewModal payment={viewedPayment} />}

      <div className="flex items-center justify-between py-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Payments</h1>
      </div>

      {/* --- MOBILE CARD VIEW (Hidden on md+) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {payments.map((pay) => (
          <div
            key={pay.id}
            className="bg-white p-4 rounded-lg border shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="overflow-hidden">
                <p className="text-[10px] text-gray-500 font-mono truncate uppercase">
                  ID: {pay.id}
                </p>
                <Link
                  href={`/admin/bookings?view=${pay.booking_id}`}
                  className="text-sm text-blue-600 font-bold hover:underline"
                >
                  Booking #{pay.booking_id}
                </Link>
              </div>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                  pay.refunded
                    ? 'bg-red-100 text-red-700'
                    : pay.status === 'succeeded'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {pay.refunded ? 'Refunded' : pay.status}
              </span>
            </div>

            <div className="flex justify-between items-end">
              <div className="text-sm">
                <p className="font-semibold text-gray-800">
                  {pay.students?.fullName || 'Unknown Student'}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(pay.created_at).toLocaleDateString()}
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(pay.amount)}
              </p>
            </div>

            <Link
              href={`/admin/payments?view=${pay.id}&page=${page}`}
              className="block w-full text-center py-2.5 bg-gray-50 text-blue-600 rounded-md text-xs font-bold border border-gray-100"
            >
              VIEW DETAILS
            </Link>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW (Hidden on < md) --- */}
      <div className="hidden md:block rounded-lg border shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Booking</th>
                <th className="p-4 font-semibold">Client</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {payments.map((pay, index) => (
                <tr
                  key={pay.id}
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-blue-50 transition-colors`}
                >
                  <td className="p-4 font-mono text-xs text-gray-500 truncate max-w-[120px]">
                    {pay.id}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/admin/bookings?view=${pay.booking_id}`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      #{pay.booking_id}
                    </Link>
                  </td>

                  <td className="p-4">{pay.students?.fullName || 'Unknown'}</td>

                  <td className="p-4 font-semibold text-gray-900">
                    {formatCurrency(pay.amount)}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        pay.refunded
                          ? 'bg-red-100 text-red-700'
                          : pay.status === 'succeeded'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {pay.refunded ? 'Refunded' : pay.status}
                    </span>
                  </td>

                  <td className="p-4 text-gray-500">
                    {new Date(pay.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/payments?view=${pay.id}&page=${page}`}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <PaginationControls page={page} hasNext={payments.length === PAGE_SIZE} />
    </div>
  );
}
