'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PrinterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { getShareholderTransactionsLedgerAction } from '@/app/_lib/actions';
import { FormatCurrency } from '@/app/_lib/utils';

// Helper to shorten repetitive/long memo descriptions
function formatMemo(tx) {
  if (tx.reference && tx.reference !== '—') {
    return `Ref: ${tx.reference}`;
  }
  let desc = tx.line_item_name || '';
  if (tx.is_redemption) return 'Redemption Payout';
  if (tx.is_dividend) return 'Dividend Payout';
  if (tx.type === 'fee') return 'Membership Fee';
  if (desc.toLowerCase().startsWith('investment in ')) return 'Capital Investment';
  return desc || 'General Portfolio';
}

// Helper to format transaction date in user's local timezone (YYYY-MM-DD)
function formatTxDate(dateStr) {
  if (!dateStr) return '—';
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str.split('T')[0] || '—';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return str.split('T')[0] || '—';
  }
}

export default function ShareholderLedgerModal({ isOpen, onClose, user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'dividend' | 'investment' | 'redemption' | 'fee'
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination (5 items per page to prevent vertical scrolling on both desktop and mobile)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Load transactions
  useEffect(() => {
    async function loadLedger() {
      try {
        setLoading(true);
        const data = await getShareholderTransactionsLedgerAction();
        setTransactions(data || []);
      } catch (err) {
        console.error('Failed to load shareholder ledger:', err);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      loadLedger();
    }
  }, [isOpen]);

  // Escape key & body overflow lock
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Reset pagination on filter or search query change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'dividend' && !tx.is_dividend) return false;
        if (typeFilter === 'investment' && (tx.is_dividend || tx.is_redemption || tx.type === 'fee')) return false;
        if (typeFilter === 'redemption' && !tx.is_redemption) return false;
        if (typeFilter === 'fee' && tx.type !== 'fee') return false;
      }

      if (statusFilter !== 'ALL') {
        const s = (tx.status || '').toLowerCase();
        if (statusFilter === 'succeeded' && !['succeeded', 'paid', 'completed', 'success'].includes(s)) return false;
        if (statusFilter === 'pending' && !['pending', 'processing'].includes(s)) return false;
        if (statusFilter === 'failed' && !['failed', 'cancelled', 'canceled'].includes(s)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (tx.line_item_name || '').toLowerCase();
        const opp = (tx.opportunity_name || '').toLowerCase();
        const ref = (tx.reference || '').toLowerCase();
        const method = (tx.ledger_category || '').toLowerCase();
        return desc.includes(q) || opp.includes(q) || ref.includes(q) || method.includes(q);
      }

      return true;
    });
  }, [transactions, typeFilter, statusFilter, searchQuery]);

  // Aggregate Metrics
  const totalInvested = useMemo(() => {
    return transactions
      .filter((tx) => !tx.is_dividend && !tx.is_redemption && tx.type !== 'fee' && ['succeeded', 'paid', 'completed'].includes(tx.status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions]);

  const totalDividends = useMemo(() => {
    return transactions
      .filter((tx) => tx.is_dividend && ['succeeded', 'paid', 'completed'].includes(tx.status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions]);

  const totalRedeemed = useMemo(() => {
    return transactions
      .filter((tx) => tx.is_redemption && ['succeeded', 'paid', 'completed'].includes(tx.status))
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
  }, [transactions]);

  const totalReceived = useMemo(() => {
    return totalDividends + totalRedeemed;
  }, [totalDividends, totalRedeemed]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTransactions, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + paginatedTransactions.length, filteredTransactions.length);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[96vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 my-auto">
        {/* HEADER BAR */}
        <div className="bg-[#000033] text-white p-3 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30 shrink-0">
              <ReceiptPercentIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white uppercase truncate">
                  Transaction <span className="text-blue-400">Ledger</span>
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                  Verified Statement
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate">
                Contributions, dividend distributions & redemptions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="Print transaction statement"
            >
              <PrinterIcon className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* COMPACT SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {/* TOTAL INVESTED */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider truncate">
                Contributed
              </span>
              <CreditCardIcon className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            </div>
            <p className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white font-mono truncate">
              {FormatCurrency(totalInvested)}
            </p>
          </div>

          {/* TOTAL DIVIDENDS */}
          <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 p-2 sm:p-2.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-purple-700 dark:text-purple-400 tracking-wider truncate">
                Dividends
              </span>
              <BanknotesIcon className="h-3.5 w-3.5 text-purple-600 shrink-0" />
            </div>
            <p className="text-xs sm:text-sm md:text-base font-black text-purple-700 dark:text-purple-400 font-mono truncate">
              + {FormatCurrency(totalDividends)}
            </p>
          </div>

          {/* TOTAL RECEIVED / RETURNS */}
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 p-2 sm:p-2.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider truncate">
                Total Returns
              </span>
              <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            </div>
            <p className="text-xs sm:text-sm md:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
              + {FormatCurrency(totalReceived)}
            </p>
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
              <span className="truncate">Div: {FormatCurrency(totalDividends)}</span>
              <span className="truncate ml-1">Red: {FormatCurrency(totalRedeemed)}</span>
            </div>
          </div>

          {/* TOTAL TRANSACTIONS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs font-bold uppercase text-slate-400 tracking-wider truncate">
                Records
              </span>
              <ReceiptPercentIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </div>
            <p className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white font-mono truncate">
              {transactions.length} Total
            </p>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-2 sm:p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search opportunity, rail, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {['ALL', 'dividend', 'investment', 'redemption', 'fee'].map((f) => {
              const label =
                f === 'ALL'
                  ? 'All'
                  : f === 'dividend'
                  ? 'Dividends'
                  : f === 'investment'
                  ? 'Invest'
                  : f === 'redemption'
                  ? 'Redeem'
                  : 'Fees';

              const isSelected = typeFilter === f;

              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTypeFilter(f)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? f === 'dividend'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : f === 'redemption'
                        ? 'bg-rose-700 text-white shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* TRANSACTIONS CONTENT (NO VERTICAL SCROLL WITH 5 ITEMS PER PAGE) */}
        <div className="p-2 sm:p-3 overflow-hidden min-h-0">
          {loading ? (
            <div className="py-12 text-center space-y-2">
              <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading ledger records...</p>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="py-10 text-center bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <ReceiptPercentIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">No Transactions Found</h3>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                {searchQuery || typeFilter !== 'ALL'
                  ? 'No records match your selected filter criteria.'
                  : 'No transactions recorded to your shareholder ledger yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE (FIXED WIDTH TO ELIMINATE HORIZONTAL SCROLL) */}
              <div className="hidden md:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <table className="w-full table-fixed text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-black text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="w-[12%] px-3 py-2">Date</th>
                      <th className="w-[13%] px-3 py-2">Type</th>
                      <th className="w-[37%] px-3 py-2">Opportunity & Details</th>
                      <th className="w-[16%] px-3 py-2">Rail / Method</th>
                      <th className="w-[10%] px-2 py-2 text-center">Status</th>
                      <th className="w-[12%] px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {paginatedTransactions.map((tx) => {
                      const isDiv = tx.is_dividend;
                      const isRed = tx.is_redemption;
                      const isFee = tx.type === 'fee';
                      const isSuccess = ['succeeded', 'paid', 'completed', 'success'].includes(tx.status);
                      const isPending = ['pending', 'processing'].includes(tx.status);

                      return (
                        <tr
                          key={tx.transaction_id}
                          className={`transition-colors ${
                            isDiv
                              ? 'bg-purple-50/30 dark:bg-purple-950/10 hover:bg-purple-50/60'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Date */}
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            {formatTxDate(tx.transaction_date)}
                          </td>

                          {/* Classification Badge */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            {isRed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                <ArrowTrendingDownIcon className="h-3 w-3 text-rose-600 shrink-0" />
                                <span>Redeem</span>
                              </span>
                            ) : isDiv ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <BanknotesIcon className="h-3 w-3 text-purple-600 shrink-0" />
                                <span>Dividend</span>
                              </span>
                            ) : isFee ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <span>Fee</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <span>Invest</span>
                              </span>
                            )}
                          </td>

                          {/* Opportunity & Short Memo */}
                          <td className="px-3 py-2">
                            <span className="font-bold text-slate-900 dark:text-white block truncate" title={tx.opportunity_name}>
                              {tx.opportunity_name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate" title={tx.line_item_name || ''}>
                              {formatMemo(tx)} {tx.reference && tx.reference !== '—' && !formatMemo(tx).includes(tx.reference) ? `• ${tx.reference}` : ''}
                            </span>
                          </td>

                          {/* Rail / Method */}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block truncate text-[11px]">
                              {tx.payout_details?.payout_rail || tx.ledger_category || 'Wire'}
                            </span>
                            {tx.payout_details?.account_number ? (
                              <span className="text-[10px] text-slate-400 font-mono block truncate">
                                •••• {tx.payout_details.account_number.slice(-4)}
                              </span>
                            ) : tx.payout_details?.account_handle ? (
                              <span className="text-[10px] text-slate-400 font-mono block truncate" title={tx.payout_details.account_handle}>
                                {tx.payout_details.account_handle}
                              </span>
                            ) : null}
                          </td>

                          {/* Status */}
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                isSuccess
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : isPending
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {isSuccess ? (
                                <CheckCircleIcon className="h-3 w-3 text-emerald-600 shrink-0" />
                              ) : isPending ? (
                                <ClockIcon className="h-3 w-3 text-amber-600 shrink-0" />
                              ) : (
                                <XCircleIcon className="h-3 w-3 text-rose-600 shrink-0" />
                              )}
                              <span>{isSuccess ? 'Paid' : isPending ? 'Pending' : 'Failed'}</span>
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="px-3 py-2 text-right font-mono font-black whitespace-nowrap text-xs">
                            {isRed ? (
                              <span className="text-rose-600 dark:text-rose-400">
                                - {FormatCurrency(Math.abs(tx.amount))}
                              </span>
                            ) : isDiv ? (
                              <span className="text-purple-700 dark:text-purple-400">
                                + {FormatCurrency(tx.amount)}
                              </span>
                            ) : (
                              <span className="text-slate-900 dark:text-white">
                                {FormatCurrency(tx.amount)}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE RESPONSIVE CARD VIEW (FITS 100% WIDTH, ZERO HORIZONTAL SCROLL) */}
              <div className="block md:hidden space-y-2">
                {paginatedTransactions.map((tx) => {
                  const isDiv = tx.is_dividend;
                  const isRed = tx.is_redemption;
                  const isFee = tx.type === 'fee';
                  const isSuccess = ['succeeded', 'paid', 'completed', 'success'].includes(tx.status);
                  const isPending = ['pending', 'processing'].includes(tx.status);

                  return (
                    <div
                      key={tx.transaction_id}
                      className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1 shadow-2xs ${
                        isRed
                          ? 'border-l-4 border-l-rose-500'
                          : isDiv
                          ? 'border-l-4 border-l-purple-500'
                          : 'border-l-4 border-l-blue-500'
                      }`}
                    >
                      {/* Top Row: Date + Status + Amount */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap">
                            {formatTxDate(tx.transaction_date)}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold capitalize ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}
                          >
                            {isSuccess ? 'Paid' : isPending ? 'Pending' : 'Failed'}
                          </span>
                        </div>

                        <div className="font-mono font-black text-xs whitespace-nowrap text-right">
                          {isRed ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              - {FormatCurrency(Math.abs(tx.amount))}
                            </span>
                          ) : isDiv ? (
                            <span className="text-purple-700 dark:text-purple-400">
                              + {FormatCurrency(tx.amount)}
                            </span>
                          ) : (
                            <span className="text-slate-900 dark:text-white">
                              {FormatCurrency(tx.amount)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Row: Type Badge + Opportunity Name */}
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isRed ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 shrink-0">
                            Redeem
                          </span>
                        ) : isDiv ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 shrink-0">
                            Dividend
                          </span>
                        ) : isFee ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shrink-0">
                            Fee
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shrink-0">
                            Invest
                          </span>
                        )}

                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate" title={tx.opportunity_name}>
                          {tx.opportunity_name}
                        </span>
                      </div>

                      {/* Bottom Row: Memo + Rail / Account */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-0.5 border-t border-slate-100 dark:border-slate-800/80 font-mono gap-1.5">
                        <span className="truncate max-w-[60%]" title={tx.line_item_name}>
                          {formatMemo(tx)}
                        </span>
                        <span className="truncate uppercase font-bold text-slate-600 dark:text-slate-400 text-right shrink-0">
                          {tx.payout_details?.payout_rail || tx.ledger_category || 'Wire'}
                          {tx.payout_details?.account_number ? ` • ${tx.payout_details.account_number.slice(-4)}` : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* FOOTER & PAGINATION BAR */}
        <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
          <div className="text-[11px] text-slate-500 font-mono">
            {filteredTransactions.length === 0 ? (
              '0 records'
            ) : (
              <>
                <strong className="text-slate-800 dark:text-slate-200">{startIndex + 1}–{endIndex}</strong> of{' '}
                <strong className="text-slate-800 dark:text-slate-200">{filteredTransactions.length}</strong>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 sm:px-2 sm:py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                title="Previous page"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <span className="px-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 sm:px-2 sm:py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                title="Next page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
