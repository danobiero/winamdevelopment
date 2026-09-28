'use client';

import React from 'react';
import Link from 'next/link';
import {
  BriefcaseIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/solid';
import { FormatCurrency } from '../_lib/utils';

const TYPE_COLORS = {
  core: '#10b981',
  real_estate: '#f59e0b',
  stocks: '#3b82f6',
  default: '#64748b',
};

export default function MainInvestmentList({
  investments = [],
  latestValuations = {},
  onViewPerformance,
  onViewStatements,
  onSelectRedemption,
}) {
  if (!investments.length) {
    return (
      <div className="lg:col-span-7 p-8 text-center bg-white border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center h-full space-y-2">
        <BriefcaseIcon className="h-8 w-8 text-slate-300 mx-auto" />
        <p className="text-slate-700 font-bold text-xs">
          No Active Positions Found
        </p>
        <p className="text-slate-400 text-xs max-w-xs mx-auto">
          Your portfolio is ready. Once you invest in an opportunity, its performance and official documents will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-7 flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-1 pb-2 mb-1 shrink-0">
        <h3 className="font-bold text-slate-900 text-xs tracking-tight flex items-center gap-1.5">
          <BriefcaseIcon className="h-4 w-4 text-blue-600" />
          Position Details
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {investments.length} Active {investments.length === 1 ? 'Asset' : 'Assets'}
        </span>
      </div>

      {/* SCROLLABLE POSITIONS LIST - Scrolls cleanly within its container without overflowing screen */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {investments.map((inv) => {
          const name = inv.opportunities?.name || 'Investment Opportunity';
          const type = (inv.opportunities?.type || 'core').toLowerCase();
          const invested = Number(inv.amount_invested || 0);

          const current = latestValuations[inv.id]
            ? Number(latestValuations[inv.id])
            : invested;

          const profit = current - invested;
          const isActive = inv.status === 'active';

          return (
            <div
              key={inv.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 hover:border-blue-300 hover:shadow-xs transition-all shadow-2xs min-w-0"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          TYPE_COLORS[type] || TYPE_COLORS.default,
                      }}
                    />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest truncate">
                      {type.replace('_', ' ')} • ID #{inv.id}
                    </span>
                  </div>
                  <h4
                    className="font-bold text-slate-900 text-sm tracking-tight truncate"
                    title={name}
                  >
                    {name}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Principal: <span className="font-mono text-slate-600 font-semibold">{FormatCurrency(invested)}</span>
                  </p>
                </div>

                <div className="w-full sm:w-auto sm:text-right min-w-0 shrink-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Current Valuation
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight break-all sm:break-words min-w-0">
                    {FormatCurrency(current)}
                  </p>
                  {invested > 0 && (
                    <p
                      className={`text-xs font-bold tracking-tight break-words min-w-0 ${
                        profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {profit >= 0 ? '▲ +' : '▼ '}
                      {FormatCurrency(Math.abs(profit))}{' '}
                      ({((profit / invested) * 100).toFixed(2)}%)
                    </p>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => onViewPerformance(inv)}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <ChartBarIcon className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                  <span>Performance</span>
                </button>

                {onViewStatements && (
                  <button
                    type="button"
                    onClick={() => onViewStatements(inv)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/60 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <DocumentTextIcon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span>Statements</span>
                  </button>
                )}

                <Link
                  href="/account/documents"
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs text-center"
                >
                  <DocumentTextIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span>Documents</span>
                </Link>

                {isActive ? (
                  <Link
                    href="/account/support"
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-2xs text-center"
                  >
                    <EnvelopeIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <span>Support</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectRedemption(inv)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>Redeem</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
