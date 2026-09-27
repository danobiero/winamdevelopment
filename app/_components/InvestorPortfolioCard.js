'use client';

import React, { useState } from 'react';
import { BriefcaseIcon } from '@heroicons/react/24/solid';
import InvestmentCard from './InvestmentCard';
import PerformanceModal from './PerformanceModal';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pending: 'bg-blue-50 text-blue-700 border-blue-100',
  withdrawal_pending: 'bg-amber-50 text-amber-700 border-amber-100',
  exited: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-50 text-red-700 border-red-100',
  default: 'bg-white text-slate-900 border-slate-200',
};

function InvestorPortfolioCard({
  investment,
  getInvestmentValuationsAction, 
}) {
  const [valuations, setValuations] = useState([]);
  const [showPerformance, setShowPerformance] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const badgeStyle = STATUS_STYLES[investment.status] || STATUS_STYLES.default;

  /**
   * -------------------------------------------------------------
   * FETCH PERFORMANCE DATA (CORRECT SERVER ACTION USAGE)
   * -------------------------------------------------------------
   */
  async function handleViewPerformance() {
    try {
      setIsFetching(true);

      const data = await getInvestmentValuationsAction(investment.id);

      setValuations(data || []);
      setShowPerformance(true);
    } catch (error) {
      console.error('Failed to load valuations:', error);
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
      {/* HEADER */}
      <div className="flex items-start justify-between w-full mb-8">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight truncate">
              {investment.opportunities?.name}
            </h3>

            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded-md border border-slate-200">
              ID: {investment.id}
            </span>
          </div>

          <p className="text-[11px] font-bold tracking-widest text-slate-400 flex items-center gap-2 mt-1 uppercase">
            <BriefcaseIcon className="h-4 w-4 text-slate-300" />
            {investment.opportunities?.type || 'Equity'}
          </p>
        </div>

        <span
          className={`flex-shrink-0 ml-4 px-3 py-1.5 rounded-lg border text-[11px] font-black uppercase shadow-sm ${badgeStyle}`}
        >
          {investment.status.replaceAll('_', ' ')}
        </span>
      </div>

      {/* CARD */}
      <InvestmentCard investment={investment} />

      {/* ACTIONS */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleViewPerformance}
          disabled={isFetching}
          className="w-full py-4 bg-blue-950 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-900 transition shadow-lg shadow-blue-900/10 disabled:opacity-70"
        >
          {isFetching ? 'Loading Data...' : 'Performance Report'}
        </button>

        <button className="w-full py-4 border-2 border-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 hover:border-slate-200 transition">
          View Documents
        </button>
      </div>

      {/* MODAL */}
      {showPerformance && (
        <PerformanceModal
          investment={investment}
          valuations={valuations}
          onClose={() => setShowPerformance(false)}
        />
      )}
    </div>
  );
}

export default InvestorPortfolioCard;
