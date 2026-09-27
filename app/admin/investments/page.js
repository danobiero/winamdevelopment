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

const getStatusBadge = (status) => {
  const s = (status || '').toUpperCase().trim();
  const map = {
    ACTIVE: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    PENDING: 'text-amber-700 bg-amber-50 border-amber-100',
    EXITED: 'text-slate-600 bg-slate-50 border-slate-100',
  };
  const style = map[s] || 'text-slate-500 bg-slate-50 border-slate-100';

  return (
    <span className={`text-[9px] font-black uppercase tracking-wider border px-2 py-0.5 rounded ${style}`}>
      {status}
    </span>
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
    }),
    getOpportunities(),
    viewId ? getInvestmentById(viewId) : null,
    redemptionId ? getRedemptionById(redemptionId) : null,
    redemptionId ? getActiveRedemptionRejectionPolicies() : [],
  ]);

  if (viewedRedemption?.investment_id) {
    ledger = await getInvestmentLedger(viewedRedemption.investment_id);
  }

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
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Investments <span className="text-blue-600">Ledger</span>
          </h1>
          <div className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit uppercase tracking-wider">
            {investments.length} Total Records
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
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="min-w-[850px] w-full divide-y divide-slate-100 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-20 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                ID
              </th>
              <th className="w-1/4 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Opportunity
              </th>
              <th className="w-1/6 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Shareholder
              </th>
              <th className="px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Timeline
              </th>
              <th className="w-28 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Invested
              </th>
              <th className="w-28 px-4 py-4 text-left font-black text-slate-400 uppercase tracking-widest">
                Status
              </th>
              <th className="w-48 px-4 py-4 text-right font-black text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {investments.map((investment) => {
              const activeRedemption = investment.redemption_requests?.find(
                (r) => r.status?.toLowerCase() === 'pending'
              );
              const hasActiveRedemption = Boolean(activeRedemption);

              return (
                <tr
                  key={investment.id}
                  className="hover:bg-blue-50/30 transition-colors group"
                >
                  <td className="px-4 py-4 font-mono text-[10px] text-slate-400 font-bold truncate">
                    #{investment.id}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-900 truncate">
                    {investment.opportunities?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-600 truncate">
                    {investment.shareholders?.fullName || 'Unknown'}
                  </td>
                  <td className="px-4 py-4 text-slate-500 font-semibold">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {formatDate(investment.start_date)}
                      </span>
                      <span className="text-slate-300 font-black">→</span>
                      <span className="bg-slate-50 px-2 py-1 rounded border border-slate-100">
                        {formatDate(investment.end_date)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-black text-slate-900">
                    {formatCurrency(investment.amount_invested ?? 0)}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(investment.status)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/investments?view=${investment.id}&page=${page}`}
                        className="text-slate-600 hover:underline font-bold uppercase text-[10px]"
                      >
                        View
                      </Link>
                      {!hasActiveRedemption && (
                        <>
                          <span className="text-slate-200">|</span>
                          <Link
                            href={`/admin/investments/${investment.id}`}
                            className="text-blue-600 hover:underline font-bold uppercase text-[10px]"
                          >
                            Edit
                          </Link>
                        </>
                      )}
                      {hasActiveRedemption && (
                        <Link
                          href={`/admin/investments?redemption=${activeRedemption.id}&page=${page}`}
                          className="ml-2 bg-blue-600 text-white px-2 py-1 rounded text-[9px] font-black uppercase"
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
