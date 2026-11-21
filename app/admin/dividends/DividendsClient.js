'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  LockClosedIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import {
  getDividendsDashboardData,
  declareDividendAction,
  approveDividendDeclarationAction,
} from './actions';
import DividendShareholdersModal from './DividendShareholdersModal';

const formatUSD = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val || 0));

export default function DividendsClient({
  initialOpportunities = [],
  initialDeclarations = [],
}) {
  const { showToast } = useToast();

  const currentYear = new Date().getFullYear();

  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [declarations, setDeclarations] = useState(initialDeclarations);
  const [refreshing, setRefreshing] = useState(false);

  // Declaration Form State
  const [fiscalYear, setFiscalYear] = useState(currentYear);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState('');
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [approveImmediately, setApproveImmediately] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  // Active Declaration opened in Shareholder Distribution & Payout Modal
  const [activeModalDeclarationId, setActiveModalDeclarationId] =
    useState(null);

  const activeModalDeclaration = useMemo(() => {
    if (!activeModalDeclarationId) return null;
    return (
      declarations.find(
        (d) => String(d.id) === String(activeModalDeclarationId)
      ) || null
    );
  }, [declarations, activeModalDeclarationId]);

  // Reload live data from server action
  const reloadDashboard = async () => {
    setRefreshing(true);
    try {
      const fresh = await getDividendsDashboardData();
      if (fresh) {
        setOpportunities(fresh.opportunities || []);
        setDeclarations(fresh.declarations || []);
      }
      return fresh;
    } catch (err) {
      showToast(err.message || 'Failed to refresh dividend data.', 'error');
      return null;
    } finally {
      setRefreshing(false);
    }
  };

  // Set of opportunity IDs that already have a declared dividend in `fiscalYear`
  const declaredOppIdsForYear = useMemo(() => {
    return new Set(
      declarations
        .filter((d) => Number(d.fiscal_year) === Number(fiscalYear))
        .map((d) => Number(d.opportunity_id))
    );
  }, [declarations, fiscalYear]);

  // Separate opportunities into Positive vs Non-Positive
  const positiveOpportunities = useMemo(
    () => opportunities.filter((o) => o.is_positive && o.net_surplus > 0),
    [opportunities]
  );

  const nonPositiveOpportunities = useMemo(
    () => opportunities.filter((o) => !o.is_positive || o.net_surplus <= 0),
    [opportunities]
  );

  const selectedOpportunity = useMemo(() => {
    if (!selectedOpportunityId) return null;
    return (
      opportunities.find(
        (o) => String(o.id) === String(selectedOpportunityId)
      ) || null
    );
  }, [opportunities, selectedOpportunityId]);

  const isSelectedAlreadyDeclared = useMemo(() => {
    if (!selectedOpportunity) return false;
    return declaredOppIdsForYear.has(Number(selectedOpportunity.id));
  }, [selectedOpportunity, declaredOppIdsForYear]);

  const numericDeclaredAmount = Number(declaredAmount) || 0;
  const maxAllowedSurplus = selectedOpportunity?.net_surplus || 0;
  const exceedsSurplusCap =
    selectedOpportunity && numericDeclaredAmount > maxAllowedSurplus + 0.001;

  // Live pro-rata preview for the currently selected opportunity and typed amount
  const liveAllocationPreview = useMemo(() => {
    if (
      !selectedOpportunity ||
      numericDeclaredAmount <= 0 ||
      exceedsSurplusCap
    ) {
      return [];
    }
    const totalInv = selectedOpportunity.total_invested || 0;
    if (totalInv <= 0) return [];

    return (selectedOpportunity.participants || []).map((p) => {
      const ratio = p.amount_invested / totalInv;
      return {
        ...p,
        preview_dividend: Number((ratio * numericDeclaredAmount).toFixed(2)),
      };
    });
  }, [selectedOpportunity, numericDeclaredAmount, exceedsSurplusCap]);

  // KPI Metrics
  const kpiStats = useMemo(() => {
    const totalPositiveSurplus = positiveOpportunities.reduce(
      (sum, o) => sum + (Number(o.net_surplus) || 0),
      0
    );
    const yearDeclarations = declarations.filter(
      (d) => Number(d.fiscal_year) === Number(fiscalYear)
    );
    const totalDeclaredThisYear = yearDeclarations.reduce(
      (sum, d) => sum + (Number(d.declared_amount) || 0),
      0
    );
    const totalDisbursedAll = declarations.reduce(
      (sum, d) => sum + (Number(d.total_disbursed) || 0),
      0
    );
    const totalRemainingAll = declarations.reduce(
      (sum, d) => sum + (Number(d.total_remaining) || 0),
      0
    );

    return {
      positiveCount: positiveOpportunities.length,
      totalPositiveSurplus,
      yearDeclaredCount: yearDeclarations.length,
      totalDeclaredThisYear,
      totalDisbursedAll,
      totalRemainingAll,
    };
  }, [positiveOpportunities, declarations, fiscalYear]);

  // Handle declaring a dividend
  async function handleDeclareSubmit(e) {
    e.preventDefault();

    if (!selectedOpportunity) {
      showToast('Please select a positive investment opportunity.', 'error');
      return;
    }
    if (!selectedOpportunity.is_positive || selectedOpportunity.net_surplus <= 0) {
      showToast(
        'Dividends can only be declared from positive investment opportunities.',
        'error'
      );
      return;
    }
    if (isSelectedAlreadyDeclared) {
      showToast(
        `A dividend has already been declared for ${selectedOpportunity.name} in ${fiscalYear}.`,
        'error'
      );
      return;
    }
    if (numericDeclaredAmount <= 0) {
      showToast(
        'Please enter a dividend amount greater than $0.00.',
        'error'
      );
      return;
    }
    if (exceedsSurplusCap) {
      showToast(
        `Dividend amount cannot exceed the positive surplus cap of ${formatUSD(
          maxAllowedSurplus
        )}.`,
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('opportunity_id', String(selectedOpportunity.id));
      formData.append('fiscal_year', String(fiscalYear));
      formData.append('declared_amount', String(numericDeclaredAmount));
      formData.append('approve_immediately', String(approveImmediately));
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await declareDividendAction(formData);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(
          res.message || 'Annual dividend declared successfully.',
          'success'
        );
        setDeclaredAmount('');
        setNotes('');
        setSelectedOpportunityId('');
        const fresh = await reloadDashboard();

        // If declared & approved immediately, open the Shareholder Distribution Modal automatically
        if (approveImmediately && res?.declaration?.id) {
          setActiveModalDeclarationId(res.declaration.id);
        } else if (approveImmediately && fresh?.declarations?.length > 0) {
          const matched = fresh.declarations.find(
            (d) =>
              Number(d.opportunity_id) === Number(selectedOpportunity.id) &&
              Number(d.fiscal_year) === Number(fiscalYear)
          );
          if (matched) setActiveModalDeclarationId(matched.id);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to declare dividend.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle approving a pending dividend declaration
  async function handleApproveDeclaration(decl) {
    setApprovingId(decl.id);
    try {
      const res = await approveDividendDeclarationAction(decl.id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(
          res.message || 'Dividend approved. Opening shareholder distribution...',
          'success'
        );
        await reloadDashboard();
        setActiveModalDeclarationId(decl.id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to approve dividend.', 'error');
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] w-full min-w-0 mx-auto">
      {/* SHAREHOLDER DISTRIBUTION & PAYOUT MODAL (AVAILABLE WHEN DIVIDEND IS DECLARED & APPROVED) */}
      {activeModalDeclaration && (
        <DividendShareholdersModal
          declaration={activeModalDeclaration}
          onClose={() => setActiveModalDeclarationId(null)}
          onPayoutRecorded={reloadDashboard}
        />
      )}

      {/* PAGE HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Annual <span className="text-emerald-600 dark:text-emerald-400">Dividends</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <BanknotesIcon className="h-3.5 w-3.5" />
              Once-Per-Year Distribution
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Declare and approve annual dividends strictly from positive investment opportunities (capped at positive valuation surplus) and manage pro-rata shareholder payouts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={reloadDashboard}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* KPI SUMMARY STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Positive Opportunities
            </span>
            <ArrowTrendingUpIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpiStats.positiveCount}{' '}
            <span className="text-xs font-bold text-slate-400">
              of {opportunities.length} Eligible
            </span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Requires Current NAV &gt; Active Invested Capital
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Available Positive Surplus
            </span>
            <BanknotesIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            {formatUSD(kpiStats.totalPositiveSurplus)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Maximum combined dividend capacity
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {fiscalYear} Declared Dividends
            </span>
            <CalendarDaysIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
            {formatUSD(kpiStats.totalDeclaredThisYear)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {kpiStats.yearDeclaredCount} Opportunity Declaration
            {kpiStats.yearDeclaredCount === 1 ? '' : 's'} in {fiscalYear}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Disbursed vs. Pending
            </span>
            <CheckCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {formatUSD(kpiStats.totalDisbursedAll)}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-1">
            {formatUSD(kpiStats.totalRemainingAll)} Unpaid Remaining
          </p>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 COLS): DECLARE ANNUAL DIVIDEND FORM */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Declare Annual <span className="text-emerald-600 dark:text-emerald-400">Dividend</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select a positive investment opportunity and declare its annual dividend distribution (max 1 per opportunity per year).
            </p>
          </div>

          <form onSubmit={handleDeclareSubmit} className="space-y-4">
            {/* Fiscal Year Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Declaration Fiscal Year
              </label>
              <div className="relative">
                <CalendarDaysIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                    <option
                      key={yr}
                      value={yr}
                      className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    >
                      Fiscal Year {yr} (Annual Declaration)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Positive Investment Opportunity Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Positive Investment Opportunity
              </label>
              <div className="relative">
                <BuildingOffice2Icon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedOpportunityId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedOpportunityId(nextId);
                    const opp = opportunities.find(
                      (o) => String(o.id) === String(nextId)
                    );
                    if (opp && opp.net_surplus > 0) {
                      setDeclaredAmount(String(opp.net_surplus));
                    } else {
                      setDeclaredAmount('');
                    }
                  }}
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option
                    value=""
                    className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  >
                    -- Select Positive Opportunity --
                  </option>

                  <optgroup
                    label="Positive Opportunities (Eligible)"
                    className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {positiveOpportunities.map((opp) => {
                      const alreadyDeclared = declaredOppIdsForYear.has(
                        Number(opp.id)
                      );
                      return (
                        <option
                          key={opp.id}
                          value={opp.id}
                          disabled={alreadyDeclared}
                          className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                        >
                          {opp.name} — Surplus: +{formatUSD(opp.net_surplus)} (
                          {opp.participant_count} Investors)
                          {alreadyDeclared
                            ? ` [Already Declared for ${fiscalYear}]`
                            : ''}
                        </option>
                      );
                    })}
                  </optgroup>

                  {nonPositiveOpportunities.length > 0 && (
                    <optgroup
                      label="Ineligible Opportunities (No Positive Surplus)"
                      className="bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {nonPositiveOpportunities.map((opp) => (
                        <option
                          key={opp.id}
                          value={opp.id}
                          disabled
                          className="bg-white text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                        >
                          {opp.name} — Surplus: {formatUSD(opp.net_surplus)}{' '}
                          (Ineligible)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>

            {/* Selected Opportunity Valuation & Surplus Snapshot */}
            {selectedOpportunity && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    {selectedOpportunity.name} Valuation Snapshot
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white">
                    +{selectedOpportunity.return_percent}% Gain
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                      Active Invested
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {formatUSD(selectedOpportunity.total_invested)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                      Current NAV
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatUSD(selectedOpportunity.current_nav)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 block">
                      Max Dividend Cap
                    </span>
                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                      {formatUSD(selectedOpportunity.net_surplus)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between pt-1">
                  <span>
                    Participating Shareholders:{' '}
                    <strong>{selectedOpportunity.participant_count}</strong>
                  </span>
                  <span>
                    Post-Dividend NAV:{' '}
                    <strong className="font-mono">
                      {formatUSD(
                        Math.max(
                          selectedOpportunity.total_invested,
                          selectedOpportunity.current_nav -
                            numericDeclaredAmount
                        )
                      )}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* Dividend Amount Input with Surplus Quick-Fill Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Total Dividend Amount ($ USD)
                </label>
                {selectedOpportunity && (
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Cap: {formatUSD(maxAllowedSurplus)}
                  </span>
                )}
              </div>

              <div className="relative">
                <BanknotesIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxAllowedSurplus || undefined}
                  required
                  disabled={!selectedOpportunity || isSelectedAlreadyDeclared}
                  value={declaredAmount}
                  onChange={(e) => setDeclaredAmount(e.target.value)}
                  placeholder={
                    selectedOpportunity
                      ? `Up to ${formatUSD(maxAllowedSurplus)}`
                      : 'Select an opportunity first'
                  }
                  className={`w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-mono font-black text-slate-900 dark:text-slate-100 outline-none transition-all ${
                    exceedsSurplusCap
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'
                  }`}
                />
              </div>

              {/* Quick Percentage Fill Buttons */}
              {selectedOpportunity && !isSelectedAlreadyDeclared && (
                <div className="grid grid-cols-4 gap-1.5 mt-2">
                  {[
                    { label: '25% Surplus', pct: 0.25 },
                    { label: '50% Surplus', pct: 0.5 },
                    { label: '75% Surplus', pct: 0.75 },
                    { label: '100% Cap', pct: 1.0 },
                  ].map((btn) => {
                    const val = Number(
                      (selectedOpportunity.net_surplus * btn.pct).toFixed(2)
                    );
                    return (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() => setDeclaredAmount(String(val))}
                        className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {exceedsSurplusCap && (
                <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                  <span>
                    Declared amount cannot exceed the positive surplus of{' '}
                    {formatUSD(maxAllowedSurplus)}.
                  </span>
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Resolution / Declaration Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Board Resolution #2026-DIV-01 Annual Distribution"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-600"
              />
            </div>

            {/* Approve Immediately Toggle */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={approveImmediately}
                onChange={(e) => setApproveImmediately(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="text-xs">
                <span className="font-black text-slate-900 dark:text-white block">
                  Approve Dividend Immediately & Open Shareholder Distribution
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Uncheck if you wish to save as Pending Approval first and
                  approve later.
                </span>
              </div>
            </label>

            {/* Live Top Shareholder Allocation Preview */}
            {liveAllocationPreview.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <span>
                    Pro-Rata Distribution Preview (
                    {liveAllocationPreview.length} Shareholders)
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    Total: {formatUSD(numericDeclaredAmount)}
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-xs">
                  {liveAllocationPreview.slice(0, 5).map((p) => (
                    <div
                      key={p.shareholder_id}
                      className="flex items-center justify-between text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate max-w-[180px] font-medium">
                        {p.fullName}{' '}
                        <span className="text-slate-400 text-[10px]">
                          ({p.ownership_percent}%)
                        </span>
                      </span>
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatUSD(p.preview_dividend)}
                      </span>
                    </div>
                  ))}
                  {liveAllocationPreview.length > 5 && (
                    <div className="text-[11px] text-slate-400 italic pt-0.5">
                      + {liveAllocationPreview.length - 5} more participating
                      shareholders...
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedOpportunity ||
                isSelectedAlreadyDeclared ||
                numericDeclaredAmount <= 0 ||
                exceedsSurplusCap
              }
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span>Declaring Dividend...</span>
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>
                    {approveImmediately
                      ? `Declare & Approve ${fiscalYear} Dividend`
                      : `Declare ${fiscalYear} Dividend (Pending Approval)`}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN (7 COLS): DECLARED DIVIDENDS LEDGER & OPPORTUNITY ELIGIBILITY MATRIX */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: DECLARED ANNUAL DIVIDENDS */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Declared Annual <span className="text-blue-600 dark:text-blue-400">Dividends</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Approve declared dividends and open the shareholder distribution window to record payouts.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full w-fit">
                {declarations.length} Total Declaration
                {declarations.length === 1 ? '' : 's'}
              </span>
            </div>

            {declarations.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <BanknotesIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase">
                  No Annual Dividends Declared Yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Use the form on the left to declare a dividend from an
                  eligible positive investment opportunity. Once approved, click
                  &ldquo;Shareholders &amp; Payouts&rdquo; to view each
                  shareholder&apos;s allocation and record payouts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="py-3.5 px-4 sm:px-6">Year / Opportunity</th>
                      <th className="py-3.5 px-4 text-right">
                        Declared Total
                      </th>
                      <th className="py-3.5 px-4">Disbursement Progress</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {declarations.map((decl) => {
                      const pct =
                        decl.total_shareholders > 0
                          ? Math.round(
                              (decl.paid_count / decl.total_shareholders) * 100
                            )
                          : 0;
                      const isPending = decl.status === 'pending_approval';

                      return (
                        <tr
                          key={decl.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-4 px-4 sm:px-6">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono font-black text-[11px]">
                                {decl.fiscal_year}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {decl.opportunity_name}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {decl.total_shareholders} Participating
                              Shareholders
                              {decl.notes ? ` • ${decl.notes}` : ''}
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm block">
                              {formatUSD(decl.declared_amount)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Surplus Cap:{' '}
                              {formatUSD(decl.net_surplus_at_declaration)}
                            </span>
                          </td>

                          <td className="py-4 px-4 min-w-[170px]">
                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                              <span className="text-slate-700 dark:text-slate-300">
                                {decl.paid_count} / {decl.total_shareholders}{' '}
                                Paid
                              </span>
                              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                {formatUSD(decl.total_disbursed)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {decl.total_remaining > 0 && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                                {formatUSD(decl.total_remaining)} Unpaid
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <ClockIcon className="h-3.5 w-3.5" />
                                Pending Approval
                              </span>
                            ) : decl.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Completed
                              </span>
                            ) : decl.status === 'partially_paid' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <BanknotesIcon className="h-3.5 w-3.5" />
                                Partially Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Approved
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleApproveDeclaration(decl)}
                                disabled={approvingId === decl.id}
                                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                {approvingId === decl.id
                                  ? 'Approving...'
                                  : 'Approve Dividend'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveModalDeclarationId(decl.id)
                                }
                                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <UserGroupIcon className="h-4 w-4" />
                                <span>Shareholders &amp; Payouts</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 2: OPPORTUNITY ELIGIBILITY & POSITIVE SURPLUS MATRIX */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 sm:px-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Opportunity Eligibility &amp; Positive Surplus Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Only opportunities with a positive valuation surplus (Current
                NAV &gt; Active Invested Capital) are eligible for annual
                dividend declarations.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4 sm:px-6">Opportunity</th>
                    <th className="py-3 px-4 text-right">Active Invested</th>
                    <th className="py-3 px-4 text-right">Current NAV</th>
                    <th className="py-3 px-4 text-right">
                      Positive Surplus Cap
                    </th>
                    <th className="py-3 px-4 text-center">Investors</th>
                    <th className="py-3 px-4 sm:px-6 text-right">
                      {fiscalYear} Eligibility
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {opportunities.map((opp) => {
                    const alreadyDeclared = declaredOppIdsForYear.has(
                      Number(opp.id)
                    );
                    return (
                      <tr
                        key={opp.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {opp.name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {opp.type}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                          {formatUSD(opp.total_invested)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {formatUSD(opp.current_nav)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-black">
                          {opp.is_positive ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              +{formatUSD(opp.net_surplus)}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">
                              {formatUSD(opp.net_surplus)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {opp.participant_count}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          {alreadyDeclared ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <LockClosedIcon className="h-3 w-3" />
                              Declared ({fiscalYear})
                            </span>
                          ) : opp.is_positive ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOpportunityId(String(opp.id));
                                setDeclaredAmount(String(opp.net_surplus));
                              }}
                              className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                            >
                              Eligible • Select
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                              Not Positive
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
