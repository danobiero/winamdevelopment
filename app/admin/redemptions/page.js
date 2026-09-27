import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  getRedemptions,
  getRedemptionById,
  getInvestmentLedger,
  createStripeRedemptionAction,
  processManualRedemptionAction,
  getActiveRedemptionRejectionPolicies,
} from './redemption-actions';

import RedemptionViewModal from './RedemptionViewModal';
import RedemptionProcessModal from './RedemptionProcessModal';
import RedemptionApprovedModalWrapper from './RedemptionApprovedModalWrapper';

import PaginationControls from '@/app/_components/PaginationControls';
import FilterPanel from '@/app/_components/FilterPanel';

const PAGE_SIZE = 10;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value ?? 0);

export default async function RedemptionsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;
  const processId = params?.redemption || null;
  const approvedId = params?.approved || null;
  const searchShareholder = params?.searchShareholder || null;

  let viewedRedemption = null;
  let processedRedemption = null;
  let approvedRedemption = null;
  let investmentLedger = [];
  let rejectionPolicies = [];

  // Data Fetching Logic for active modal
  if (viewId || processId || approvedId) {
    const targetId = viewId || processId || approvedId;
    const red = await getRedemptionById(targetId);

    if (red?.investment_id) {
      investmentLedger = await getInvestmentLedger(red.investment_id);
    }

    if (viewId) viewedRedemption = red;
    if (approvedId) approvedRedemption = red;
    if (processId) {
      processedRedemption = red;
      // Only fetch policies if the Process modal is opening
      rejectionPolicies = await getActiveRedemptionRejectionPolicies();
    }
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const redemptions = await getRedemptions({ from, to, searchShareholder });

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] mx-auto h-full">
      {/* --- MODALS --- */}
      {viewedRedemption && (
        <RedemptionViewModal
          redemption={viewedRedemption}
          ledger={investmentLedger}
        />
      )}
      {processedRedemption && (
        <RedemptionProcessModal
          redemption={processedRedemption}
          ledger={investmentLedger}
          rejectionPolicies={rejectionPolicies}
        />
      )}
      {approvedRedemption && (
        <RedemptionApprovedModalWrapper
          redemption={approvedRedemption}
          ledger={investmentLedger}
          createAction={createStripeRedemptionAction}
          manualAction={processManualRedemptionAction}
        />
      )}

      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Redemption <span className="text-blue-600">Requests</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            {redemptions.length} Total Records
          </div>
        </div>

        {/* STATUS KEY / LEGEND */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Status Key:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Pending
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Approved
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Completed
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Rejected
            </span>
          </div>
        </div>
      </div>

      <FilterPanel
        basePath="/admin/redemptions"
        searchLabel="Search Shareholder"
        searchParamName="searchShareholder"
        placeholder="Type shareholder name..."
        initialSearchValue={searchShareholder || ''}
      />

      {/* --- MOBILE CARD VIEW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
        {redemptions.map((red) => (
          <div
            key={red.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <span className="text-[9px] font-mono text-slate-400 font-bold">
                #{String(red.id).slice(0, 8)}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(red.amount)}
                </span>
                {Number(red.already_redeemed_so_far || 0) > 0 && (
                  <span className="text-[9px] text-slate-400 font-bold mt-0.5">
                    Paid: {formatCurrency(red.already_redeemed_so_far)}
                  </span>
                )}
              </div>
            </div>

            <div className="w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Opportunity
              </p>
              <div className="flex flex-col gap-0.5">
                {/* NEW: Opportunity Name */}
                <p className="text-sm font-bold text-slate-900 truncate">
                  {red.investments?.opportunities?.name ||
                    'Unknown Opportunity'}
                </p>
                <Link
                  href={`/admin/investments?view=${red.investment_id}`}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Inv #{red.investment_id}
                </Link>
              </div>
            </div>

            <div className="w-full">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Shareholder
              </p>
              <p className="text-sm font-medium text-slate-700">
                {red.shareholders?.fullName || 'Unknown Shareholder'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Status
                </p>
                <div className="flex flex-col gap-1 items-start">
                  <StatusBadge status={red.status} />
                  {red.status === 'rejected' &&
                    red.redemption_rejection_policies && (
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                        Reason: {red.redemption_rejection_policies.code}
                      </span>
                    )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 mt-auto border-t border-slate-50">
              <Link
                href={`/admin/redemptions?view=${red.id}&page=${page}`}
                className="px-3 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
              >
                View Details
              </Link>
              {red.status === 'pending' && (
                <Link
                  href={`/admin/redemptions?redemption=${red.id}&page=${page}`}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-md active:scale-95 transition-all"
                >
                  Process Request
                </Link>
              )}
              {red.status === 'approved' && Number(red.already_redeemed_so_far || 0) < Number(red.amount || 0) && (
                <Link
                  href={`/admin/redemptions?approved=${red.id}&page=${page}`}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-md active:scale-95 transition-all"
                >
                  Process Payout
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP TABLE VIEW --- */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="min-w-[850px] w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-24 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                ID
              </th>
              {/* EXPANDED COLUMN WIDTH FOR OPPORTUNITY */}
              <th className="w-48 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Opportunity
              </th>
              <th className="px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Shareholder
              </th>
              <th className="w-32 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Amount
              </th>
              <th className="w-32 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Paid Out
              </th>
              <th className="w-56 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Status
              </th>
              <th className="w-48 px-4 py-4 text-right font-black text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {redemptions.map((red) => (
              <tr
                key={red.id}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="px-4 py-4 font-mono text-[10px] text-slate-400 font-bold truncate">
                  #{String(red.id).slice(0, 8)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-0.5">
                    {/* NEW: Opportunity Name */}
                    <span
                      className="font-bold text-slate-900 truncate"
                      title={red.investments?.opportunities?.name}
                    >
                      {red.investments?.opportunities?.name ||
                        'Unknown Opportunity'}
                    </span>
                    <Link
                      href={`/admin/investments?view=${red.investment_id}`}
                      className="text-[10px] text-blue-600 font-medium hover:underline"
                    >
                      Inv #{red.investment_id}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-4 font-bold text-slate-900 truncate">
                  {red.shareholders?.fullName}
                </td>
                <td className="px-4 py-4 font-black text-slate-900">
                  {formatCurrency(red.amount)}
                </td>
                <td className="px-4 py-4 font-bold text-slate-500">
                  {formatCurrency(red.already_redeemed_so_far || 0)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <StatusIndicator status={red.status} />
                      <StatusBadge status={red.status} />
                    </div>
                    {red.status === 'rejected' &&
                      red.redemption_rejection_policies && (
                        <div className="text-[9px] font-bold text-red-500 mt-1 truncate pr-2">
                          {red.redemption_rejection_policies.code} -{' '}
                          {red.redemption_rejection_policies.title}
                        </div>
                      )}
                  </div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end items-center gap-3">
                    <Link
                      href={`/admin/redemptions?view=${red.id}&page=${page}`}
                      className="text-blue-600 hover:underline font-bold uppercase text-[10px]"
                    >
                      View
                    </Link>
                    {red.status === 'pending' && (
                      <>
                        <span className="text-slate-200">|</span>
                        <Link
                          href={`/admin/redemptions?redemption=${red.id}&page=${page}`}
                          className="bg-blue-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase shadow-sm"
                        >
                          Process
                        </Link>
                      </>
                    )}
                    {red.status === 'approved' && Number(red.already_redeemed_so_far || 0) < Number(red.amount || 0) && (
                      <>
                        <span className="text-slate-200">|</span>
                        <Link
                          href={`/admin/redemptions?approved=${red.id}&page=${page}`}
                          className="bg-emerald-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase shadow-sm"
                        >
                          Payout
                        </Link>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pt-2 pb-8">
        <PaginationControls
          page={page}
          hasNext={redemptions.length === PAGE_SIZE}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    approved: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    completed: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    pending: 'text-amber-600 bg-amber-50 border-amber-100',
    rejected: 'text-red-600 bg-red-50 border-red-100',
  };

  return (
    <span
      className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${styles[status] || styles.pending}`}
    >
      {status || 'pending'}
    </span>
  );
}

function StatusIndicator({ status }) {
  const colors = {
    approved: 'bg-emerald-500',
    completed: 'bg-indigo-500',
    pending: 'bg-amber-500',
    rejected: 'bg-red-500',
  };

  return (
    <div
      className={`h-2 w-2 rounded-full ${colors[status] || colors.pending} cursor-help transition-transform hover:scale-125`}
      title={`Status: ${status}`}
    />
  );
}
