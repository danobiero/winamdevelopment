import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getOpportunities } from '@/app/_lib/data-service';
import { getAllReports, getShareholdersList } from '../reports/actions';
import ReportsClient from '../reports/ReportsClient';

export const metadata = {
  title: 'Financial Reports | Admin Console',
};

export default async function FinanceReportsPage() {
  const session = await auth();
  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const [opportunities, reports, shareholders] = await Promise.all([
    getOpportunities().catch(() => []),
    getAllReports().catch(() => []),
    getShareholdersList().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] w-full min-w-0 mx-auto">
      <ReportsClient
        initialReports={reports}
        opportunities={opportunities}
        shareholders={shareholders}
        isFinanceMode={true}
      />
    </div>
  );
}
