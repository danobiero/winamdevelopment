'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  XMarkIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingOffice2Icon,
  ArrowTopRightOnSquareIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { getShareholderTransactionsLedgerAction } from '@/app/_lib/actions';
import { FormatCurrency } from '@/app/_lib/utils';
import { format, parseISO } from 'date-fns';

export default function ShareholderLedgerModal({ isOpen, onClose, user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'dividend' | 'investment' | 'fee'
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== 'ALL') {
        if (typeFilter === 'dividend' && !tx.is_dividend) return false;
        if (typeFilter === 'investment' && (tx.is_dividend || tx.type === 'fee')) return false;
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
      .filter((tx) => !tx.is_dividend && tx.type !== 'fee' && ['succeeded', 'paid', 'completed'].includes(tx.status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions]);

  const totalDividends = useMemo(() => {
    return transactions
      .filter((tx) => tx.is_dividend && ['succeeded', 'paid', 'completed'].includes(tx.status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions]);

  const totalFees = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'fee' && ['succeeded', 'paid', 'completed'].includes(tx.status))
      .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
  }, [transactions]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[94vh] sm:h-[88vh] max-h-[94vh] sm:max-h-[88vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 min-h-0">
        {/* HEADER BAR */}
        <div className="bg-[#000033] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30 shrink-0">
              <ReceiptPercentIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                  Transaction <span className="text-blue-400">Ledger</span>
                </h2>
                <span className="px-2 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Verified Statement
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Complete record of capital contributions, dividend disbursements, and administrative ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              title="Print transaction statement"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* SUMMARY KPI CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 p-3.5 sm:p-5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {/* TOTAL INVESTED */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Capital Contributed
              </span>
              <CreditCardIcon className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono truncate">
              {FormatCurrency(totalInvested)}
            </p>
          </div>

          {/* TOTAL DIVIDENDS */}
          <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900/60 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-purple-700 dark:text-purple-400 tracking-wider">
                Dividends Disbursed
              </span>
              <BanknotesIcon className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-sm sm:text-base font-black text-purple-700 dark:text-purple-400 font-mono truncate">
              + {FormatCurrency(totalDividends)}
            </p>
          </div>

          {/* NET POSITION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Total Received / Returns
              </span>
              <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
              {FormatCurrency(totalDividends)}
            </p>
          </div>

          {/* TOTAL TRANSACTIONS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Total Transactions
              </span>
              <ReceiptPercentIcon className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono truncate">
              {transactions.length} Records
            </p>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by opportunity, memo, reference, or rail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {['ALL', 'dividend', 'investment', 'fee'].map((f) => {
              const label =
                f === 'ALL'
                  ? 'All Transactions'
                  : f === 'dividend'
                  ? 'Dividends'
                  : f === 'investment'
                  ? 'Investments'
                  : 'Fees';

              const isSelected = typeFilter === f;

              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setTypeFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? f === 'dividend'
                        ? 'bg-purple-700 text-white shadow-xs'
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

        {/* TRANSACTIONS TABLE CONTENT (FLEX-1 SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0 custom-scrollbar">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading transaction ledger...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <ReceiptPercentIcon className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Transactions Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || typeFilter !== 'ALL'
                  ? 'No records match your selected filter criteria.'
                  : 'No transactions have been recorded to your shareholder ledger yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase font-black text-xs tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Classification</th>
                    <th className="px-3 py-2.5">Opportunity & Memo</th>
                    <th className="px-3 py-2.5">Payout / Payment Rail</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filteredTransactions.map((tx) => {
                    const isDiv = tx.is_dividend;
                    const isFee = tx.type === 'fee';
                    const isSuccess = ['succeeded', 'paid', 'completed', 'success'].includes(tx.status);
                    const isPending = ['pending', 'processing'].includes(tx.status);

                    return (
                      <tr
                        key={tx.transaction_id}
                        className={`transition-colors ${
                          isDiv
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-50/70'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Date */}
                        <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {tx.transaction_date ? tx.transaction_date.split('T')[0] : '—'}
                        </td>

                        {/* Classification Badge */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {isDiv ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              <BanknotesIcon className="h-3 w-3 text-purple-600" />
                              <span>Dividend</span>
                            </span>
                          ) : isFee ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <span>Fee</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <span>Investment</span>
                            </span>
                          )}
                        </td>

                        {/* Opportunity & Memo */}
                        <td className="px-3 py-2.5">
                          <span className="font-bold text-slate-900 dark:text-white block max-w-xs sm:max-w-md truncate">
                            {tx.opportunity_name}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 block truncate">
                            {tx.line_item_name} {tx.reference ? `• Ref: ${tx.reference}` : ''}
                          </span>
                        </td>

                        {/* Rail / Method */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300 uppercase block">
                            {tx.payout_details?.payout_rail || tx.ledger_category || 'Wire'}
                          </span>
                          {tx.payout_details?.account_number && (
                            <span className="text-xs text-slate-400 font-mono block">
                              Acct: •••• {tx.payout_details.account_number.slice(-4)}
                            </span>
                          )}
                          {tx.payout_details?.account_handle && (
                            <span className="text-xs text-slate-400 font-mono block truncate max-w-[140px]">
                              {tx.payout_details.account_handle}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : isPending
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {isSuccess ? (
                              <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                            ) : isPending ? (
                              <ClockIcon className="h-3 w-3 text-amber-600" />
                            ) : (
                              <XCircleIcon className="h-3 w-3 text-rose-600" />
                            )}
                            <span>{tx.status}</span>
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-3 py-2.5 text-right font-mono font-black whitespace-nowrap text-sm">
                          {isDiv ? (
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
          )}
        </div>

        {/* FOOTER */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Showing <strong className="text-slate-800 dark:text-slate-200">{filteredTransactions.length}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{transactions.length}</strong> ledger records
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
