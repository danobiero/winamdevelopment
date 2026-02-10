import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { getPayments, getPaymentById } from './payment-actions';
import PaymentViewModal from './PaymentViewModal';
import PaginationControls from '@/app/_components/PaginationControls';

const PAGE_SIZE = 10;

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
    <div className="space-y-6 w-full">
      {/* View Modal */}
      {viewedPayment && <PaymentViewModal payment={viewedPayment} />}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payments</h1>
      </div>

      <div className="rounded-lg border shadow-sm bg-white overflow-hidden">
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-100 border-b sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Booking</th>
                <th className="p-4 font-semibold">Student</th>
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
                  <td className="p-4 truncate max-w-[120px]">{pay.id}</td>

                  <td className="p-4">
                    <Link
                      href={`/admin/bookings?view=${pay.booking_id}`}
                      className="text-blue-600 hover:underline"
                    >
                      #{pay.booking_id}
                    </Link>
                  </td>

                  <td className="p-4">{pay.students?.fullName || 'Unknown'}</td>

                  <td className="p-4 font-semibold">${pay.amount}</td>

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

                  <td className="p-4">
                    {new Date(pay.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/payments?view=${pay.id}&page=${page}`}
                      className="text-blue-600 hover:underline"
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
