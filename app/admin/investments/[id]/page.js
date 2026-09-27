import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

// You will need to create these specific actions for the new schema
import {
  getInvestmentById,
  getOpportunity,
  getInvestmentContext,
} from '../actions';

import EditInvestmentFormClient from './EditInvestmentFormClient';

export const revalidate = 0;

export default async function Page({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');
  const adminId = session.user.adminId;

  const investmentId = Number(params.id);

  // 1️⃣ Fetch investment
  const investment = await getInvestmentById(investmentId);
  if (!investment) throw new Error('Investment not found');

  // 2️⃣ Fetch the linked opportunity
  const opportunity = await getOpportunity(investment.opportunity_id);
  if (!opportunity) throw new Error('Opportunity not found');

  // 3️⃣ Fetch context (e.g., total committed vs available capacity)
  const context = await getInvestmentContext(opportunity.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/admin/investments"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">
            ←
          </span>
          Back to Investments
        </Link>
      </div>

      <EditInvestmentFormClient
        investment={investment}
        opportunity={opportunity}
        context={context}
        adminId={adminId}
      />
    </div>
  );
}
