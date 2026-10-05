'use client';

import { useState, useMemo, useTransition } from 'react';
import {
  MagnifyingGlassIcon,
  UsersIcon,
  ChartBarIcon,
  CreditCardIcon,
  ArrowUturnLeftIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
} from '@heroicons/react/24/solid';
import ShareholderDrillDownModal from './ShareholderDrillDownModal';
import { getShareholderDrillDown } from './actions';

const formatUSD = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(val ?? 0);

export default function ShareholdersClientView({
  initialShareholders = [],
  initialSelectedId = null,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive', 'directors', 'hasNulls', 'invested'
  const [selectedShareholderData, setSelectedShareholderData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Metrics calculation
  const totalCount = initialShareholders.length;
  const activeCount = initialShareholders.filter(
    (s) => (s.shareholderStatus || '').toLowerCase() === 'active'
  ).length;
  const directorCount = initialShareholders.filter((s) => s.isDirector).length;
  const nullDetailsCount = initialShareholders.filter(
    (s) => s.stats?.hasNullFields
  ).length;

  const totalCapitalInvested = initialShareholders.reduce(
    (sum, s) => sum + (s.stats?.totalInvested || 0),
    0
  );
  const totalRedeemedPaid = initialShareholders.reduce(
    (sum, s) => sum + (s.stats?.totalRedeemedAmount || 0),
    0
  );

  // Filter & Search
  const filteredShareholders = useMemo(() => {
    return initialShareholders.filter((s) => {
      // 1. Text Search
      const q = search.toLowerCase().trim();
      const matchText =
        !q ||
        String(s.id).includes(q) ||
        (s.fullName || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.telephone || '').toLowerCase().includes(q);

      if (!matchText) return false;

      // 2. Status / Category Filters
      if (filter === 'active') return (s.shareholderStatus || '').toLowerCase() === 'active';
      if (filter === 'inactive') return (s.shareholderStatus || '').toLowerCase() !== 'active';
      if (filter === 'directors') return Boolean(s.isDirector);
      if (filter === 'hasNulls') return Boolean(s.stats?.hasNullFields);
      if (filter === 'invested') return (s.stats?.totalInvested || 0) > 0;
      if (filter === 'noInvestments') return (s.stats?.totalInvested || 0) === 0;

      return true;
    });
  }, [initialShareholders, search, filter]);

  // Handle drill down selection
  const handleOpenDrillDown = (shareholderId) => {
    startTransition(async () => {
      try {
        setIsModalOpen(true);
        const drillDown = await getShareholderDrillDown(shareholderId);
        setSelectedShareholderData(drillDown);
      } catch (err) {
        console.error('Failed to load drill down:', err);
        alert('Could not load shareholder details: ' + err.message);
        setIsModalOpen(false);
      }
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedShareholderData(null);
  };

  return (
    <div className="space-y-6">
      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <UsersIcon className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Registry
            </span>
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {totalCount}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            {activeCount} active • {directorCount} director{directorCount === 1 ? '' : 's'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ChartBarIcon className="h-4 w-4 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Invested
            </span>
          </div>
          <span className="text-2xl font-black text-emerald-700 font-mono">
            {formatUSD(totalCapitalInvested)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            Active portfolio allocations
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ArrowUturnLeftIcon className="h-4 w-4 text-red-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Total Redemptions
            </span>
          </div>
          <span className="text-2xl font-black text-red-600 font-mono">
            {formatUSD(-totalRedeemedPaid)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            Capital paid out
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <CreditCardIcon className="h-4 w-4 text-purple-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Net Equity
            </span>
          </div>
          <span className="text-2xl font-black text-purple-900 font-mono">
            {formatUSD(totalCapitalInvested - totalRedeemedPaid)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
            Invested less redemptions
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Missing / Null Data
            </span>
          </div>
          <span className="text-2xl font-black text-amber-700 font-mono">
            {nullDetailsCount}
          </span>
          <span className="text-[11px] text-amber-600 font-medium block mt-0.5">
            Accounts with null details
          </span>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* SEARCH INPUT */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, shareholder name, email, or telephone number..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="text-xs text-slate-500 font-bold shrink-0 self-center">
            Showing <span className="text-blue-600 font-mono">{filteredShareholders.length}</span> of{' '}
            <span className="font-mono">{totalCount}</span>
          </div>
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <FunnelIcon className="h-3 w-3" /> Filters:
          </span>
          {[
            { id: 'all', label: 'All Shareholders' },
            { id: 'active', label: 'Active Status' },
            { id: 'inactive', label: 'Inactive / Pending' },
            { id: 'directors', label: 'Directors' },
            { id: 'invested', label: 'With Capital Invested' },
            { id: 'noInvestments', label: 'Zero Investments' },
            { id: 'hasNulls', label: 'Has NULL / Unset Details' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* SHAREHOLDERS DIRECTORY TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Shareholder Info</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4">Status & Role</th>
                <th className="py-3 px-4 text-right">Investments</th>
                <th className="py-3 px-4 text-right">Payments</th>
                <th className="py-3 px-4 text-right">Redemptions</th>
                <th className="py-3 px-4">Payout Method</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShareholders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No shareholders found matching the search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredShareholders.map((sh) => {
                  const hasNullPhone = !sh.telephone;
                  const hasNoInvestments = (sh.stats?.totalInvested || 0) === 0;

                  return (
                    <tr
                      key={sh.id}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        #{sh.id}
                      </td>

                      {/* SHAREHOLDER INFO */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                            {sh.fullName ? sh.fullName.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block group-hover:text-blue-600 transition-colors">
                              {sh.fullName || (
                                <span className="text-amber-600 bg-amber-50 px-1 rounded font-mono text-[10px]">
                                  NULL
                                </span>
                              )}
                            </span>
                            <span className="text-slate-400 font-mono text-[11px] block">
                              {sh.email || (
                                <span className="text-amber-600 bg-amber-50 px-1 rounded text-[10px]">
                                  NULL
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* PHONE / CONTACT */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {hasNullPhone ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            NULL
                          </span>
                        ) : (
                          sh.telephone
                        )}
                        {sh.nationality && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {sh.nationality}
                          </span>
                        )}
                      </td>

                      {/* STATUS & ROLE */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              sh.shareholderStatus === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sh.shareholderStatus || 'NULL'}
                          </span>
                          {sh.isDirector && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              Director
                            </span>
                          )}
                        </div>
                      </td>

                      {/* INVESTMENTS */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-slate-900 block">
                          {formatUSD(sh.stats?.totalInvested)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {sh.stats?.investmentsCount || 0} allocation{sh.stats?.investmentsCount === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* PAYMENTS */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-emerald-700 block">
                          {formatUSD(sh.stats?.totalPaymentsAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {sh.stats?.paymentsCount || 0} txn{sh.stats?.paymentsCount === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* REDEMPTIONS */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-red-600 block">
                          {sh.stats?.totalRedeemedAmount > 0
                            ? formatUSD(-sh.stats?.totalRedeemedAmount)
                            : '$0.00'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {sh.stats?.redemptionsCount || 0} payout{sh.stats?.redemptionsCount === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* PAYOUT METHOD */}
                      <td className="py-3.5 px-4">
                        {sh.stats?.hasPaymentMethod ? (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold uppercase text-[10px]">
                            {sh.stats?.payoutMethodType || 'Configured'}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                            NULL / None
                          </span>
                        )}
                      </td>

                      {/* DRILL DOWN ACTION */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenDrillDown(sh.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-sm cursor-pointer"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          <span>Drill Down</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360-DEGREE DRILL DOWN MODAL */}
      <ShareholderDrillDownModal
        data={selectedShareholderData}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isLoading={isPending}
      />
    </div>
  );
}
