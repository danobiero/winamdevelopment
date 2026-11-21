import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getDividendsDashboardData } from './actions';
import DividendsClient from './DividendsClient';

export const metadata = {
  title: 'Annual Dividends | Admin Console',
  description:
    'Declare annual dividends from positive investment opportunities and manage shareholder dividend payouts',
};

export default async function AdminDividendsPage() {
  const session = await auth();
  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const { opportunities, declarations } =
    await getDividendsDashboardData().catch((err) => {
      console.error('Error loading dividends dashboard data:', err);
      return { opportunities: [], declarations: [] };
    });

  return (
    <DividendsClient
      initialOpportunities={opportunities}
      initialDeclarations={declarations}
    />
  );
}
