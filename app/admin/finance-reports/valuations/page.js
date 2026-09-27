import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getOpportunities, getOpportunityValuations } from '@/app/_lib/data-service';
import ValuationsClient from './ValuationsClient';

export const metadata = {
  title: 'Opportunity Valuations | Admin Console',
};

export default async function ValuationsPage() {
  const session = await auth();
  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const [opportunities, valuations] = await Promise.all([
    getOpportunities().catch(() => []),
    getOpportunityValuations().catch(() => []),
  ]);

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] w-full min-w-0 mx-auto">
      <ValuationsClient
        opportunities={opportunities}
        initialValuations={valuations}
      />
    </div>
  );
}
