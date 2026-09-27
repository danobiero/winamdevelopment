import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import {
  getOpportunitiesWithValuations,
  getShareholdersWithPaymentMethods,
  getAllOperatingExpenses,
} from '@/app/admin/reports/actions';
import { getPayments } from '@/app/admin/payments/payment-actions';
import TransactionsClient from './TransactionsClient';

export const metadata = {
  title: 'Financial Transactions | Winam Admin',
  description: 'Manage payments, subscriptions, dividend disbursements, and operating expense ledgers',
};

export default async function TransactionsPage() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const [opportunities, shareholders, initialExpenses, initialPayments] =
    await Promise.all([
      getOpportunitiesWithValuations(),
      getShareholdersWithPaymentMethods(),
      getAllOperatingExpenses(),
      getPayments({ from: 0, to: 200 }),
    ]);

  return (
    <TransactionsClient
      opportunities={opportunities || []}
      shareholders={shareholders || []}
      initialExpenses={initialExpenses || []}
      initialPayments={initialPayments || []}
    />
  );
}
