import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import {
  getInvestments,
  getInvestmentById,
  getInvestmentLedger,
  getRedemptionById,
} from './actions';

// ADDED: Import your policy fetcher from wherever it lives (adjust path if needed)
import { getActiveRedemptionRejectionPolicies } from '../redemptions/redemption-actions';
import { getOpportunities } from '../opportunities/actions';

import ViewInvestmentModal from './ViewInvestmentModal';
import RedemptionProcessModal from '../redemptions/RedemptionProcessModal';
import PaginationControls from '@/app/_components/PaginationControls';
import FilterPanel from '@/app/_components/FilterPanel';

const PAGE_SIZE = 10;

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusBadge = (status, amountInvested) => {
  const isZeroOrExited =
    Number(amountInvested ?? 0) <= 0 ||
    (status || '').toUpperCase().trim() === 'EXITED';
  const s = isZeroOrExited ? 'EXITED' : (status || '').toUpperCase().trim();
  const map = {
    ACTIVE: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    PENDING: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    EXITED: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  };
  const style = map[s] || 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`text-xs font-black uppercase tracking-wider border px-2 py-0.5 rounded ${style}`}>
        {isZeroOrExited ? 'EXITED' : status}
      </span>
      {isZeroOrExited && (
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400">
          Not Participating
        </span>
      )}
    </div>
  );
};

export default async function InvestmentsPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');

  const params = await searchParams;
  const page = Number(params?.page ?? 1);
  const viewId = params?.view || null;
  const redemptionId = params?.redemption || null;
  const searchShareholder = params?.searchShareholder || null;
  const filterOpportunity = params?.filterOpportunity || null;
  const filterStatus = params?.filterStatus || 'participating';

  let ledger = [];

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  // Fetching all data in parallel for optimal page load speed
  const [investments, opportunities, viewedInvestment, viewedRedemption, rejectionPolicies] = await Promise.all([
    getInvestments({
      from,
      to,
      searchShareholder,
      filterOpportunity,
      filterStatus,
    }),
    getOpportunities(),
    viewId ? getInvestmentById(viewId) : null,
    redemptionId ? getRedemptionById(redemptionId) : null,
    redemptionId ? getActiveRedemptionRejectionPolicies() : [],
  ]);

  if (viewedRedemption?.investment_id) {
    ledger = await getInvestmentLedger(viewedRedemption.investment_id);
  }

  const buildStatusHref = (nextStatus) => {
    const q = new URLSearchParams();
    if (filterOpportunity) q.set('filterOpportunity', filterOpportunity);
    if (searchShareholder) q.set('searchShareholder', searchShareholder);
    if (nextStatus && nextStatus !== 'participating') {
      q.set('filterStatus', nextStatus);
    }
    const qs = q.toString();
    return qs ? `/admin/investments?${qs}` : '/admin/investments';
  };

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] mx-auto h-full">
      {/* Modals */}
      {viewedInvestment && (
        <ViewInvestmentModal investment={viewedInvestment} />
      )}
      {viewedRedemption && (
        <RedemptionProcessModal
          redemption={viewedRedemption}
          ledger={ledger}
          rejectionPolicies={rejectionPolicies} // ADDED: Passed policies to modal
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Investments <span className="text-blue-600 dark:text-blue-400">Ledger</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <Link
                href={buildStatusHref('participating')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === 'participating'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Participating Investors
              </Link>
              <Link
                href={buildStatusHref('exited')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === 'exited'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Exited / Redeemed ($0)
              </Link>
              <Link
                href={buildStatusHref('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterStatus === 'all'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-black'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </Link>
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full w-fit uppercase tracking-wider">
              {investments.length} {filterStatus === 'participating' ? 'Active Participating' : 'Total'} Records
            </div>
          </div>
        </div>
      </div>

      <FilterPanel
        basePath="/admin/investments"
        opportunities={opportunities}
        initialSearchValue={searchShareholder || ''}
        initialFilterOpportunity={filterOpportunity || ''}
      />

      {/* --- TABLE VIEW --- */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <table className="min-w-[850px] w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/80">
            <tr>
              <th className="w-20 px-4 py-4 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                ID
              </th>
              <th className="w-1/4 px-4 py-4 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Opportunity
              </th>
              <th className="w-1/6 px-4 py-4 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Shareholder
              </th>
              <th className="px-4 py-4 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Timeline
              </th>
              <th className="w-28 px-4 py-4 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Invested
              </th>
              <th className="w-28 px-4 py-4 text-left font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Status
              </th>
              <th className="w-48 px-4 py-4 text-right font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {investments.map((investment) => {
              const activeRedemption = investment.redemption_requests?.find(
                (r) => r.status?.toLowerCase() === 'pending'
              );
              const hasActiveRedemption = Boolean(activeRedemption);

              return (
                <tr
                  key={investment.id}
                  className="hover:bg-blue-50/30 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  <td className="px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-400 font-bold truncate">
                    #{investment.id}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-900 dark:text-slate-100 truncate">
                    {investment.opportunities?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-200 truncate">
                    {investment.shareholders?.fullName || 'Unknown'}
                  </td>
                  <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-semibold">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                        {formatDate(investment.start_date)}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500 font-black">→</span>
                      <span className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
                        {formatDate(investment.end_date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black text-slate-900 dark:text-white">
                    {formatCurrency(investment.amount_invested ?? 0)}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(investment.status, investment.amount_invested)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/investments?view=${investment.id}&page=${page}`}
                        className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline font-bold uppercase text-xs"
                      >
                        View
                      </Link>
                      {!hasActiveRedemption && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <Link
                            href={`/admin/investments/${investment.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-bold uppercase text-xs"
                          >
                            Edit
                          </Link>
                        </>
                      )}
                      {hasActiveRedemption && (
                        <Link
                          href={`/admin/investments?redemption=${activeRedemption.id}&page=${page}`}
                          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-black uppercase"
                        >
                          Redemption
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-2 pb-8">
        <PaginationControls
          page={page}
          hasNext={investments.length === PAGE_SIZE}
        />
      </div>
    </div>
  );
}
