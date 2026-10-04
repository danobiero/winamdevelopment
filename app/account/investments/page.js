import EmptyPortfolioState from '@/app/_components/EmptyPortfolioState';
import InvestmentList from '@/app/_components/InvestmentList';
import WithdrawalBanner from '@/app/_components/WithdrawalBanner';
import { auth } from '@/app/_lib/auth';
import { getAllInvestments } from '@/app/_lib/data-service';
import { getActiveWithdrawalFormsForShareholder } from '@/app/_lib/withdrawal-form-actions';
import { FormatCurrency } from '@/app/_lib/utils';
import {
  BanknotesIcon,
  BriefcaseIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

export const metadata = {
  title: 'My Investments | WINAM',
};

export default async function Page() {
  const session = await auth();

  const [investments, withdrawalForms] = await Promise.all([
    getAllInvestments(session.user.shareholderId),
    getActiveWithdrawalFormsForShareholder(session.user.shareholderId),
  ]);

  // Financial aggregates
  const totalDeployed = (investments || []).reduce(
    (sum, inv) => sum + (Number(inv.amount_invested) || 0),
    0
  );
  const totalCommitted = (investments || []).reduce(
    (sum, inv) => sum + (Number(inv.total_committed) || 0),
    0
  );
  const activeCount = (investments || []).filter(
    (inv) => inv.status === 'active'
  ).length;
  const sectorsCount = new Set(
    (investments || []).map((inv) => (inv.opportunities?.type || 'Equity').toLowerCase())
  ).size;

  return (
    <div className="w-full flex flex-col space-y-2.5 sm:space-y-3">
      {/* 1. HEADER (BLACK & BLUE WORDS THEME, COMPACT) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Your <span className="text-blue-600 dark:text-blue-400">Investments</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs font-medium">
            Track and manage your active investment portfolio, capital deployment, and statements
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-[10px] sm:text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded-lg font-bold shadow-2xs">
            {(investments || []).length} {(investments || []).length === 1 ? 'Position' : 'Positions'}
          </div>
        </div>
      </header>

      {/* USA Land Project Withdrawal Forms Notice */}
      <WithdrawalBanner
        forms={withdrawalForms}
        shareholderId={session.user.shareholderId}
      />

      {/* 2. SUMMARY KPI METRICS STRIP (COMPACT HORIZONTAL FORMAT, NO VERTICAL BLOAT) */}
      {investments && investments.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 shrink-0">
          {/* TOTAL DEPLOYED */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 sm:py-2 rounded-xl shadow-2xs min-w-0 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate block">
                Total Deployed
              </span>
              <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 truncate leading-tight">
                {FormatCurrency(totalDeployed)}
              </p>
            </div>
            <BanknotesIcon className="h-4 w-4 text-emerald-600 shrink-0 ml-1" />
          </div>

          {/* TOTAL COMMITTED */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 sm:py-2 rounded-xl shadow-2xs min-w-0 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate block">
                Total Committed
              </span>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate leading-tight">
                {FormatCurrency(totalCommitted)}
              </p>
            </div>
            <ShieldCheckIcon className="h-4 w-4 text-blue-600 shrink-0 ml-1" />
          </div>

          {/* ACTIVE ASSETS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 sm:py-2 rounded-xl shadow-2xs min-w-0 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate block">
                Active Assets
              </span>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate leading-tight">
                {activeCount} Position{activeCount === 1 ? '' : 's'}
              </p>
            </div>
            <BriefcaseIcon className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
          </div>

          {/* ASSET SECTORS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 px-3 py-1.5 sm:py-2 rounded-xl shadow-2xs min-w-0 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate block">
                Asset Sectors
              </span>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate leading-tight">
                {sectorsCount} Sector{sectorsCount === 1 ? '' : 's'}
              </p>
            </div>
            <Squares2X2Icon className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
          </div>
        </div>
      )}

      {/* SECTION DIVIDER */}
      <hr className="w-full border-t border-slate-200/80 dark:border-slate-800 my-0.5" />

      {/* 3. MAIN INVESTMENTS LIST (FITS ALL 4 POSITIONS VERTICALLY ON SCREEN) */}
      <div className="w-full">
        {!investments || investments.length === 0 ? (
          <div className="flex items-center justify-center p-6">
            <EmptyPortfolioState />
          </div>
        ) : (
          <InvestmentList investments={investments} />
        )}
      </div>
    </div>
  );
}
