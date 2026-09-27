'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ChartPieIcon,
  PresentationChartLineIcon,
  BanknotesIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { formatClientError } from '@/app/_lib/client-error-handler';

import PerformanceModal from './PerformanceModal';
import RedemptionModal from './RedemptionModal';
import PaymentStatementModal from './PaymentStatementModal';
import MainInvestmentList from './MainInvestmentList';
import { FormatCurrency } from '../_lib/utils';

const TYPE_COLORS = {
  core: '#10b981',
  real_estate: '#f59e0b',
  stocks: '#3b82f6',
  default: '#64748b',
};

export default function PortfolioClientView({
  investments = [],
  requestRedemptionAction,
  getInvestmentValuationsAction,
}) {
  const router = useRouter();
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [statementInv, setStatementInv] = useState(null);
  const [performanceData, setPerformanceData] = useState({
    visible: false,
    valuations: [],
    activeInv: null,
  });
  const [isWorking, setIsWorking] = useState(false);
  const [latestValuations, setLatestValuations] = useState({});

  // Sync latest valuations for display
  useEffect(() => {
    async function fetchAllLatest() {
      const valuationMap = {};
      await Promise.all(
        investments.map(async (inv) => {
          try {
            const vals = await getInvestmentValuationsAction(inv.id);
            if (vals?.length > 0) {
              valuationMap[inv.id] = vals[vals.length - 1].value;
            }
          } catch (e) {
            console.error(`Error fetching ID ${inv.id}:`, e);
          }
        })
      );
      setLatestValuations(valuationMap);
    }
    if (investments?.length > 0) fetchAllLatest();
  }, [investments, getInvestmentValuationsAction]);

  const metrics = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;

    const chartData = (investments || []).map((inv) => {
      const current = Number(
        latestValuations[inv.id] || inv.amount_invested || 0
      );
      totalInvested += Number(inv.amount_invested || 0);
      totalCurrentValue += current;

      const type = (inv.opportunities?.type || 'core').toLowerCase();
      return {
        id: inv.id,
        name: inv.opportunities?.name || 'Investment',
        value: current,
        fill: TYPE_COLORS[type] || TYPE_COLORS.default,
        displayType: type.replace('_', ' '),
      };
    });

    const totalReturn =
      totalInvested > 0
        ? ((totalCurrentValue - totalInvested) / totalInvested) * 100
        : 0;

    const uniqueSectors = new Set(
      (investments || []).map((i) => i.opportunities?.type || 'core')
    ).size;

    return {
      totalInvested,
      totalCurrentValue,
      totalReturn,
      chartData,
      uniqueSectors,
    };
  }, [investments, latestValuations]);

  const handleViewPerformance = async (inv) => {
    try {
      setIsWorking(true);
      const data = await getInvestmentValuationsAction(inv.id);
      setPerformanceData({
        visible: true,
        valuations: data || [],
        activeInv: inv,
      });
    } catch (error) {
      toast.error('Performance data unavailable');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 sm:gap-4 animate-in fade-in duration-300">
      {/* EXECUTIVE KPI STACK - Compact height to fit screen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
        {/* CARD 1: PORTFOLIO VALUE */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-3.5 sm:p-4 rounded-2xl text-white relative overflow-hidden shadow-md border border-slate-800 flex flex-col justify-between min-w-0">
          <div className="relative z-10 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Portfolio Valuation
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight truncate">
              {FormatCurrency(metrics.totalCurrentValue)}
            </p>
          </div>

          <div className="relative z-10 pt-2 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span
              className={`font-bold ${
                metrics.totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {metrics.totalReturn >= 0 ? '▲ +' : '▼ '}
              {metrics.totalReturn.toFixed(2)}%
            </span>
            <span className="text-slate-400 font-medium text-[10px]">Net Asset Value</span>
          </div>

          <PresentationChartLineIcon className="absolute -right-3 -bottom-3 h-20 w-20 text-white/5 pointer-events-none" />
        </div>

        {/* CARD 2: INVESTED CAPITAL */}
        <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Invested Capital
              </span>
              <div className="p-1 bg-emerald-50 text-emerald-600 rounded-lg">
                <BanknotesIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
              {FormatCurrency(metrics.totalInvested)}
            </p>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Principal Committed</span>
            <span className="font-bold text-slate-800 text-[10px]">100% Deployed</span>
          </div>
        </div>

        {/* CARD 3: ACTIVE HOLDINGS (REPLACES UNREALIZED GAIN) */}
        <div className="bg-white border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Active Holdings
              </span>
              <div className="p-1 bg-blue-50 text-blue-600 rounded-lg">
                <BriefcaseIcon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              {investments.length}{' '}
              <span className="text-sm sm:text-base font-bold text-slate-400">
                {investments.length === 1 ? 'Position' : 'Positions'}
              </span>
            </p>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Asset Classes</span>
            <span className="font-bold text-blue-600 text-[10px]">
              {metrics.uniqueSectors}{' '}
              {metrics.uniqueSectors === 1 ? 'Sector' : 'Sectors'}
            </span>
          </div>
        </div>
      </div>

      {/* ASSET ALLOCATION & POSITIONS - Fills remaining viewport space */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0">
        {/* ASSET ALLOCATION CARD */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 shrink-0">
            <h3 className="font-bold text-slate-900 text-xs tracking-tight flex items-center gap-1.5">
              <ChartPieIcon className="h-4 w-4 text-blue-600" />
              Asset Allocation
            </h3>
            <span className="text-[10px] font-bold text-slate-400 font-mono">
              {metrics.chartData.length} {metrics.chartData.length === 1 ? 'Holding' : 'Holdings'}
            </span>
          </div>

          {/* DONUT CHART */}
          <div className="flex-1 min-h-[140px] max-h-[190px] w-full relative flex items-center justify-center">
            {metrics.chartData.length === 0 ? (
              <div className="text-center text-slate-400 text-xs font-medium">
                No allocation data available.
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.chartData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      cornerRadius={4}
                      dataKey="value"
                    >
                      {metrics.chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.fill}
                          strokeWidth={2}
                          stroke="#ffffff"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [FormatCurrency(v), 'Current Value']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        borderRadius: '10px',
                        border: 'none',
                        boxShadow: '0 8px 20px -4px rgba(0, 0, 0, 0.3)',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '6px 10px',
                      }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center px-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Total Assets
                  </span>
                  <span className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-[110px]">
                    {FormatCurrency(metrics.totalCurrentValue)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ALLOCATION BREAKDOWN LIST */}
          {metrics.chartData.length > 0 && (
            <div className="pt-2 border-t border-slate-100 overflow-y-auto max-h-[110px] custom-scrollbar space-y-1.5 shrink-0 mt-auto">
              {metrics.chartData.map((entry, idx) => {
                const pct =
                  metrics.totalCurrentValue > 0
                    ? ((entry.value / metrics.totalCurrentValue) * 100).toFixed(1)
                    : '0.0';

                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.fill }}
                      />
                      <span className="font-medium text-slate-700 truncate">
                        {entry.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2 font-mono">
                      <span className="font-bold text-slate-900">
                        {FormatCurrency(entry.value)}
                      </span>
                      <span className="text-[10px] text-slate-400 w-9 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* LIST COMPONENT */}
        <MainInvestmentList
          investments={investments}
          latestValuations={latestValuations}
          onViewPerformance={handleViewPerformance}
          onViewStatements={setStatementInv}
          onSelectRedemption={setSelectedInvestment}
        />
      </div>

      {statementInv && (
        <PaymentStatementModal
          opportunityId={statementInv.opportunity_id}
          opportunityName={statementInv.opportunities?.name}
          onClose={() => setStatementInv(null)}
        />
      )}

      {performanceData.visible && (
        <PerformanceModal
          investment={performanceData.activeInv}
          valuations={performanceData.valuations}
          onClose={() =>
            setPerformanceData({ ...performanceData, visible: false })
          }
        />
      )}

      {selectedInvestment && (
        <RedemptionModal
          investment={selectedInvestment}
          isWorking={isWorking}
          onClose={() => setSelectedInvestment(null)}
          onSubmit={async (id, data) => {
            try {
              setIsWorking(true);
              await requestRedemptionAction(id, data.reason);
              toast.success('Redemption request submitted successfully.');
              setSelectedInvestment(null);
              router.refresh();
            } catch (err) {
              console.error('Redemption failed:', err);
              toast.error(
                formatClientError(err, 'Unable to submit redemption request. Please try again.')
              );
            } finally {
              setIsWorking(false);
            }
          }}
        />
      )}
    </div>
  );
}
