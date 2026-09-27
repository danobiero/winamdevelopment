import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getOpportunities } from '@/app/_lib/data-service';
import { getAllReports } from './actions';
import ReportsClient from './ReportsClient';

export const metadata = {
  title: 'Opportunity Reports & Meeting Minutes | Admin Console',
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const [opportunities, reports] = await Promise.all([
    getOpportunities().catch(() => []),
    getAllReports().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] w-full min-w-0 mx-auto">
      <ReportsClient
        initialReports={reports}
        opportunities={opportunities}
      />
    </div>
  );
}
