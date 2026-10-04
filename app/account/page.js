// app/account/page.js
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/app/_lib/auth';
import {
  getMemberStatusByEmail,
  getInvestments,
} from '@/app/_lib/data-service';
import { requestRedemption, getInvestmentValuations } from '@/app/_lib/actions';

import Spinner from '../_components/Spinner';
import PortfolioClientView from '../_components/PortfolioClientView';
import WithdrawalBanner from '../_components/WithdrawalBanner';
import { getActiveWithdrawalFormsForShareholder } from '@/app/_lib/withdrawal-form-actions';
import { getMaintenanceStatus } from '@/app/_lib/maintenance-actions';
import AccountMaintenanceView from '../_components/AccountMaintenanceView';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  // Check system maintenance status
  const maintenanceStatus = await getMaintenanceStatus();
  if (maintenanceStatus.isMaintenanceActive) {
    return (
      <AccountMaintenanceView
        config={maintenanceStatus.config}
        shareholderName={session.user.name}
      />
    );
  }

  // 1. Fetch membership status and the computed completion flag
  const membershipRecord = await getMemberStatusByEmail(session.user.email);

  // 2. Instantly redirect using the centralized boolean
  if (!membershipRecord?.isFullyCompleted) {
    redirect('/membership');
  }

  // 3. ONLY fetch investments if they pass the gatekeeper
  const activeInvestments = await getInvestments(session.user.shareholderId);

  // 4. Fetch any active withdrawal forms (USA Land Project)
  const withdrawalForms = await getActiveWithdrawalFormsForShareholder(
    session.user.shareholderId
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pb-2 sm:pb-2.5 shrink-0">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            <span className="text-blue-600 dark:text-blue-400">WINAM</span> Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Welcome back, {session.user.name || 'Shareholder'} • Global Investment Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg shadow-2xs font-bold">
            Shareholder ID #{session.user.shareholderId || 'Active'}
          </span>
        </div>
      </header>
 
      {/* USA Land Project Withdrawal Forms Notice */}
      <WithdrawalBanner
        forms={withdrawalForms}
        shareholderId={session.user.shareholderId}
      />

      <div className="flex-1 min-h-0 flex flex-col">
        <Suspense fallback={<Spinner />}>
          <PortfolioClientView
            investments={activeInvestments}
            requestRedemptionAction={requestRedemption}
            getInvestmentValuationsAction={getInvestmentValuations}
          />
        </Suspense>
      </div>
    </div>
  );
}
