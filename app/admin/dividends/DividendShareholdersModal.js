'use client';

import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  XMarkIcon,
  BanknotesIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  DocumentCheckIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { recordDeclaredDividendPayoutAction } from './actions';

const formatUSD = (val) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(val || 0));

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function DividendShareholdersModal({
  declaration,
  onClose,
  onPayoutRecorded,
}) {
  const { showToast } = useToast();

  // Filter state: 'all' | 'unpaid' | 'paid'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active shareholder selected for "Begin Payout"
  const [activePayoutShareholder, setActivePayoutShareholder] = useState(null);
  const [payoutRail, setPayoutRail] = useState('wire');
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().split('T')[0]
  );
  const [reference, setReference] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHandle, setAccountHandle] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Populate payout form when admin clicks "Begin Payout" on an unpaid shareholder
  useEffect(() => {
    if (activePayoutShareholder && declaration) {
      const pm = activePayoutShareholder.payment_method;
      setPayoutRail((pm?.payment_type || 'wire').toLowerCase());
      setAccountName(
        pm?.account_name || activePayoutShareholder.fullName || ''
      );
      setAccountNumber(pm?.account_number || '');
      setAccountHandle(
        pm?.account_handle || activePayoutShareholder.email || ''
      );
      setReference('');
      setDescription(
        `${declaration.fiscal_year} Annual Dividend Payout - ${declaration.opportunity_name}`
      );
      setNotes('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [activePayoutShareholder, declaration]);

  const schedule = declaration?.shareholders_schedule || [];

  const filteredSchedule = useMemo(() => {
    return schedule.filter((sh) => {
      if (statusFilter === 'paid' && !sh.is_paid) return false;
      if (statusFilter === 'unpaid' && sh.is_paid) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (sh.fullName || '').toLowerCase().includes(q);
        const emailMatch = (sh.email || '').toLowerCase().includes(q);
        const idMatch = String(sh.shareholder_id).includes(q);
        return nameMatch || emailMatch || idMatch;
      }
      return true;
    });
  }, [schedule, statusFilter, searchQuery]);

  const totals = useMemo(() => {
    const totalInvested = schedule.reduce(
      (s, r) => s + (Number(r.amount_invested) || 0),
      0
    );
    const totalAllocated = schedule.reduce(
      (s, r) => s + (Number(r.dividend_amount) || 0),
      0
    );
    const totalPaid = schedule
      .filter((r) => r.is_paid)
      .reduce((s, r) => s + (Number(r.paid_amount || r.dividend_amount) || 0), 0);
    const totalUnpaid = Math.max(0, totalAllocated - totalPaid);

    const filteredAllocated = filteredSchedule.reduce(
      (s, r) => s + (Number(r.dividend_amount) || 0),
      0
    );
    const filteredInvested = filteredSchedule.reduce(
      (s, r) => s + (Number(r.amount_invested) || 0),
      0
    );

    return {
      totalInvested,
      totalAllocated,
      totalPaid,
      totalUnpaid,
      filteredAllocated,
      filteredInvested,
    };
  }, [schedule, filteredSchedule]);

  if (!declaration) return null;

  const progressPercent =
    declaration.total_shareholders > 0
      ? Math.round(
          (declaration.paid_count / declaration.total_shareholders) * 100
        )
      : 0;

  async function handleConfirmPayout(e) {
    e.preventDefault();
    if (!activePayoutShareholder) return;

    setSubmittingPayout(true);
    try {
      const formData = new FormData();
      formData.append('declaration_id', String(declaration.id));
      formData.append('opportunity_id', String(declaration.opportunity_id));
      formData.append(
        'shareholder_id',
        String(activePayoutShareholder.shareholder_id)
      );
      formData.append('fiscal_year', String(declaration.fiscal_year));
      formData.append(
        'amount',
        String(activePayoutShareholder.dividend_amount)
      );
      formData.append(
        'ownership_percent',
        String(activePayoutShareholder.ownership_percent)
      );
      formData.append(
        'invested_amount',
        String(activePayoutShareholder.amount_invested)
      );
      formData.append('payment_date', paymentDate);
      formData.append('payout_rail', payoutRail);
      formData.append('account_name', accountName);
      formData.append('account_number', accountNumber);
      formData.append('account_handle', accountHandle);
      if (reference.trim()) formData.append('reference', reference.trim());
      if (description.trim())
        formData.append('description', description.trim());
      if (notes.trim()) formData.append('notes', notes.trim());

      const res = await recordDeclaredDividendPayoutAction(formData);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast(
          res.message || 'Dividend payout recorded successfully.',
          'success'
        );
        setActivePayoutShareholder(null);
        if (onPayoutRecorded) {
          await onPayoutRecorded();
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to record dividend payout.', 'error');
    } finally {
      setSubmittingPayout(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 sm:p-6 flex flex-col gap-4 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30">
                <BanknotesIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {declaration.opportunity_name} — {declaration.fiscal_year}{' '}
                    Dividend Distribution
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                      declaration.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                        : declaration.status === 'partially_paid'
                          ? 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                          : 'bg-blue-500/20 text-blue-200 border-blue-400/40'
                    }`}
                  >
                    {declaration.status === 'completed'
                      ? 'All Disbursed'
                      : declaration.status === 'partially_paid'
                        ? 'Disbursing in Progress'
                        : 'Approved for Payout'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Pro-rata dividend entitlement schedule across all{' '}
                  {declaration.total_shareholders} participating shareholders
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* SUMMARY METRICS STRIP */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <div className="bg-white/10 border border-white/15 rounded-xl p-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                Total to be Disbursed
              </span>
              <span className="text-base sm:text-lg font-black text-white font-mono">
                {formatUSD(declaration.declared_amount)}
              </span>
              <span className="text-[11px] text-slate-300 block mt-0.5">
                {declaration.total_shareholders} Participating Shareholders
              </span>
            </div>

            <div className="bg-emerald-500/15 border border-emerald-400/25 rounded-xl p-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
                Total Paid Out
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-300 font-mono">
                {formatUSD(totals.totalPaid)}
              </span>
              <span className="text-[11px] text-emerald-200 block mt-0.5">
                {declaration.paid_count} of {declaration.total_shareholders}{' '}
                Shareholders Paid
              </span>
            </div>

            <div className="bg-amber-500/15 border border-amber-400/25 rounded-xl p-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">
                Remaining Unpaid Balance
              </span>
              <span className="text-base sm:text-lg font-black text-amber-300 font-mono">
                {formatUSD(totals.totalUnpaid)}
              </span>
              <span className="text-[11px] text-amber-200 block mt-0.5">
                {declaration.unpaid_count} Shareholders Awaiting Payout
              </span>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                  Payout Completion
                </span>
                <span className="text-xs font-black text-emerald-300 font-mono">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden my-1.5">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-slate-300">
                Declared on {formatDate(declaration.declaration_date)}
              </span>
            </div>
          </div>
        </div>

        {/* INLINE PAYOUT RECORDING FORM (IF ADMIN CLICKED "BEGIN PAYOUT" ON AN UNPAID SHAREHOLDER) */}
        {activePayoutShareholder && (
          <div className="bg-purple-50/90 dark:bg-slate-800/95 border-b-2 border-purple-200 dark:border-purple-800 p-4 sm:p-5 shrink-0 animate-in fade-in duration-200">
            <form onSubmit={handleConfirmPayout} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-200/70 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-600 text-white">
                    <CreditCardIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      Begin Dividend Payout Record —{' '}
                      <span className="text-purple-700 dark:text-purple-400">
                        {activePayoutShareholder.fullName}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Active Investment:{' '}
                      <strong>
                        {formatUSD(activePayoutShareholder.amount_invested)}
                      </strong>{' '}
                      ({activePayoutShareholder.ownership_percent}% share) •
                      Dividend Entitlement:{' '}
                      <strong className="text-emerald-700 dark:text-emerald-400 font-mono">
                        {formatUSD(activePayoutShareholder.dividend_amount)}
                      </strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePayoutShareholder(null)}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 w-fit cursor-pointer"
                >
                  Cancel Payout
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dividend Payout Amount
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formatUSD(activePayoutShareholder.dividend_amount)}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono font-black text-emerald-700 dark:text-emerald-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payout Method / Rail
                  </label>
                  <select
                    value={payoutRail}
                    onChange={(e) => setPayoutRail(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-purple-600"
                  >
                    {['wire', 'ach', 'zelle', 'cashapp', 'check', 'manual'].map(
                      (m) => (
                        <option
                          key={m}
                          value={m}
                          className="bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                        >
                          {m.toUpperCase()}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Distribution Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-purple-600 dark:[color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reference / Confirmation #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Wire Ref #, Zelle ID, Check #"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Account Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Account Handle / Email / Routing
                  </label>
                  <input
                    type="text"
                    value={accountHandle}
                    onChange={(e) => setAccountHandle(e.target.value)}
                    placeholder="Zelle email/phone or bank account"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional payout verification notes"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActivePayoutShareholder(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black uppercase tracking-wider shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {submittingPayout ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      <span>Recording Payout...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>
                        Confirm & Record Payout (
                        {formatUSD(activePayoutShareholder.dividend_amount)})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FILTER TABS (ALL / UNPAID / PAID) & SEARCH BAR */}
        <div className="p-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl w-fit">
            {[
              {
                key: 'all',
                label: 'All Shareholders',
                count: declaration.total_shareholders,
              },
              {
                key: 'unpaid',
                label: 'Unpaid',
                count: declaration.unpaid_count,
              },
              {
                key: 'paid',
                label: 'Paid',
                count: declaration.paid_count,
              },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? tab.key === 'unpaid'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : tab.key === 'paid'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-black/20 text-white'
                        : 'bg-slate-300/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shareholder name or email..."
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* SHAREHOLDER PARTICIPATION & DIVIDEND SCHEDULE TABLE */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Shareholder</th>
                <th className="py-3.5 px-4 text-right">Active Invested</th>
                <th className="py-3.5 px-4 text-right">Share (%)</th>
                <th className="py-3.5 px-4 text-right">Dividend Amount</th>
                <th className="py-3.5 px-4">Registered Payout Rail</th>
                <th className="py-3.5 px-4 text-center">Payout Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredSchedule.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 px-6 text-center text-sm text-slate-500 dark:text-slate-400 font-medium"
                  >
                    No participating shareholders match the current filter (
                    {statusFilter.toUpperCase()}).
                  </td>
                </tr>
              ) : (
                filteredSchedule.map((sh) => {
                  const isCurrentlySelected =
                    activePayoutShareholder?.shareholder_id ===
                    sh.shareholder_id;

                  return (
                    <tr
                      key={sh.shareholder_id}
                      className={`transition-colors ${
                        isCurrentlySelected
                          ? 'bg-purple-50/70 dark:bg-purple-950/30'
                          : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {sh.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sh.email}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {formatUSD(sh.amount_invested)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {Number(sh.ownership_percent).toFixed(2)}%
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm whitespace-nowrap">
                        {formatUSD(sh.dividend_amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        {sh.payment_method ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {sh.payment_method.payment_type}
                            </span>
                            <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-[180px]">
                              {sh.payment_method.account_handle ||
                                (sh.payment_method.account_number
                                  ? `•••• ${sh.payment_method.account_number.slice(-4)}`
                                  : sh.payment_method.account_name)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            Manual / No saved rail
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {sh.is_paid ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircleIcon className="h-3.5 w-3.5" />
                              Paid
                            </span>
                            {sh.paid_at && (
                              <span className="text-[10px] text-slate-400 mt-0.5">
                                {formatDate(sh.paid_at)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <ClockIcon className="h-3.5 w-3.5" />
                            Unpaid
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        {sh.is_paid ? (
                          <div className="text-right">
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                              Disbursed ({sh.payout_rail?.toUpperCase()})
                            </span>
                            {sh.payment_reference && (
                              <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[140px] ml-auto">
                                Ref: {sh.payment_reference}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActivePayoutShareholder(sh)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all active:scale-95 cursor-pointer"
                          >
                            Begin Payout
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL FOOTER WITH TOTALS RECONCILIATION */}
        <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                Showing ({filteredSchedule.length} Shareholders):
              </span>{' '}
              <span className="font-mono font-black text-slate-900 dark:text-white">
                {formatUSD(totals.filteredAllocated)}
              </span>
            </div>
            <div className="hidden sm:block text-slate-300 dark:text-slate-700">
              |
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 font-bold">
                Total Declared to Disburse:
              </span>{' '}
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                {formatUSD(declaration.declared_amount)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer w-fit ml-auto sm:ml-0"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
