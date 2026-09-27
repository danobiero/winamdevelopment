'use client';

import { useState, useMemo } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  PlusIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  UserIcon,
  CalendarIcon,
  CalendarDaysIcon,
  TrashIcon,
  PencilSquareIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

import AddExpenseModal from '@/app/admin/reports/AddExpenseModal';
import DeleteExpenseModal from '@/app/admin/reports/DeleteExpenseModal';
import RecordPaymentModal from '@/app/admin/reports/RecordPaymentModal';
import PaymentViewModal from '@/app/admin/payments/PaymentViewModal';
import RecordDividendPayoutModal from './RecordDividendPayoutModal';
import {
  getAllOperatingExpenses,
  deleteOperatingExpenseAction,
} from '@/app/admin/reports/actions';
import { getPayments } from '@/app/admin/payments/payment-actions';

const formatUSD = (amount) => {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function TransactionsClient({
  opportunities = [],
  shareholders = [],
  initialExpenses = [],
  initialPayments = [],
}) {
  const { showToast } = useToast();

  // Active View Tab: 'expenses' | 'payments'
  const [activeTab, setActiveTab] = useState('expenses');

  // Ledger Data State
  const [expenses, setExpenses] = useState(initialExpenses);
  const [payments, setPayments] = useState(initialPayments);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpportunityFilter, setSelectedOpportunityFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');

  // Financial Period Filters (like Core Quarterly Financial Statements)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11
  const defaultQuarter =
    currentMonth <= 2
      ? 'Q1'
      : currentMonth <= 5
      ? 'Q2'
      : currentMonth <= 8
      ? 'Q3'
      : 'Q4';

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState(defaultQuarter);

  // Period date boundary helper
  const periodDisplay = useMemo(() => {
    if (selectedYear === 'ALL') {
      if (selectedQuarter === 'Q1') return { start: 'Jan 1 (All Years)', end: 'Mar 31' };
      if (selectedQuarter === 'Q2') return { start: 'Apr 1 (All Years)', end: 'Jun 30' };
      if (selectedQuarter === 'Q3') return { start: 'Jul 1 (All Years)', end: 'Sep 30' };
      if (selectedQuarter === 'Q4') return { start: 'Oct 1 (All Years)', end: 'Dec 31' };
      return { start: 'All History', end: 'Present' };
    }
    const yr = Number(selectedYear);
    if (selectedQuarter === 'Q1') return { start: `${yr}-01-01`, end: `${yr}-03-31` };
    if (selectedQuarter === 'Q2') return { start: `${yr}-04-01`, end: `${yr}-06-30` };
    if (selectedQuarter === 'Q3') return { start: `${yr}-07-01`, end: `${yr}-09-30` };
    if (selectedQuarter === 'Q4') return { start: `${yr}-10-01`, end: `${yr}-12-31` };
    return { start: `${yr}-01-01`, end: `${yr}-12-31` };
  }, [selectedYear, selectedQuarter]);

  // Check if a date string falls inside the selected Year & Quarter
  const isDateInPeriod = (dateStr) => {
    if (!dateStr) return false;
    const clean = dateStr.split('T')[0];
    const parts = clean.split('-');
    if (parts.length < 3) return false;
    const yr = Number(parts[0]);
    const mo = Number(parts[1]);

    if (selectedYear !== 'ALL' && yr !== Number(selectedYear)) {
      return false;
    }

    if (selectedQuarter === 'ALL') {
      return true;
    }

    let q = '';
    if (mo >= 1 && mo <= 3) q = 'Q1';
    else if (mo >= 4 && mo <= 6) q = 'Q2';
    else if (mo >= 7 && mo <= 9) q = 'Q3';
    else if (mo >= 10 && mo <= 12) q = 'Q4';

    return q === selectedQuarter;
  };

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeletingExpense, setIsDeletingExpense] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDividendModalOpen, setIsDividendModalOpen] = useState(false);
  const [viewedPayment, setViewedPayment] = useState(null);

  // Refresh functions
  const reloadExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const data = await getAllOperatingExpenses({
        opportunityId: selectedOpportunityFilter !== 'ALL' ? selectedOpportunityFilter : undefined,
      });
      setExpenses(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to reload expenses', 'error');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const reloadPayments = async () => {
    setLoadingPayments(true);
    try {
      const data = await getPayments({
        from: 0,
        to: 200,
        filterOpportunity: selectedOpportunityFilter !== 'ALL' ? selectedOpportunityFilter : undefined,
      });
      setPayments(data || []);
    } catch (err) {
      showToast(err.message || 'Failed to reload payments', 'error');
    } finally {
      setLoadingPayments(false);
    }
  };

  // Delete Expense Confirmation Handler
  const handleConfirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    try {
      setIsDeletingExpense(true);
      const res = await deleteOperatingExpenseAction(expenseToDelete.id);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Expense record deleted.', 'warning');
        setExpenseToDelete(null);
        await reloadExpenses();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete expense', 'error');
    } finally {
      setIsDeletingExpense(false);
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Period Filter (Year & Quarter)
      if (!isDateInPeriod(e.expense_date)) {
        return false;
      }
      // Opportunity Filter
      if (selectedOpportunityFilter !== 'ALL' && String(e.opportunity_id) !== String(selectedOpportunityFilter)) {
        return false;
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const vendor = (e.vendor || '').toLowerCase();
        const desc = (e.description || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        const opp = (e.opportunities?.name || '').toLowerCase();
        return vendor.includes(q) || desc.includes(q) || cat.includes(q) || opp.includes(q);
      }
      return true;
    });
  }, [expenses, selectedYear, selectedQuarter, selectedOpportunityFilter, searchQuery]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Period Filter (Year & Quarter)
      if (!isDateInPeriod(p.created_at)) {
        return false;
      }
      // Opportunity Filter
      if (selectedOpportunityFilter !== 'ALL' && String(p.opportunity_id) !== String(selectedOpportunityFilter)) {
        return false;
      }
      // Status Filter
      if (paymentStatusFilter !== 'ALL') {
        if (paymentStatusFilter === 'dividend') {
          const isDiv = p.type === 'dividend' || p.type === 'dividend_payout' || p.metadata?.is_dividend === true;
          if (!isDiv) return false;
        } else {
          const status = (p.status || '').toLowerCase();
          if (paymentStatusFilter === 'succeeded' && !['succeeded', 'success', 'paid', 'complete', 'completed'].includes(status)) {
            return false;
          }
          if (paymentStatusFilter === 'pending' && !['pending', 'processing', 'incomplete'].includes(status)) {
            return false;
          }
          if (paymentStatusFilter === 'failed' && !['failed', 'canceled', 'cancelled', 'error'].includes(status)) {
            return false;
          }
        }
      }
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const shName = (p.shareholders?.fullName || '').toLowerCase();
        const opp = (p.opportunities?.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const id = (p.id || '').toLowerCase();
        return shName.includes(q) || opp.includes(q) || desc.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [payments, selectedYear, selectedQuarter, selectedOpportunityFilter, paymentStatusFilter, searchQuery]);

  // Totals
  const totalExpensesAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const totalPaymentsAmount = useMemo(() => {
    return filteredPayments.reduce((sum, p) => {
      const isPaid = ['succeeded', 'success', 'paid', 'complete', 'completed'].includes((p.status || '').toLowerCase());
      return isPaid ? sum + (Number(p.amount) || 0) : sum;
    }, 0);
  }, [filteredPayments]);

  const allExpensesTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const allPaymentsTotal = useMemo(() => {
    return payments.reduce((sum, p) => {
      const isPaid = ['succeeded', 'success', 'paid', 'complete', 'completed'].includes((p.status || '').toLowerCase());
      return isPaid ? sum + (Number(p.amount) || 0) : sum;
    }, 0);
  }, [payments]);

  const netCashFlow = totalPaymentsAmount - totalExpensesAmount;

  // Pagination State
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesPageSize, setExpensesPageSize] = useState(10);

  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState(10);

  // Paginated Slices
  const totalExpensesPages = Math.ceil(filteredExpenses.length / expensesPageSize) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * expensesPageSize;
    return filteredExpenses.slice(start, start + expensesPageSize);
  }, [filteredExpenses, expensesPage, expensesPageSize]);

  const totalPaymentsPages = Math.ceil(filteredPayments.length / paymentsPageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (paymentsPage - 1) * paymentsPageSize;
    return filteredPayments.slice(start, start + paymentsPageSize);
  }, [filteredPayments, paymentsPage, paymentsPageSize]);

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] mx-auto h-full">
      {/* HEADER BAR */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#000033] uppercase tracking-tight">
                Financial <span className="text-blue-600">Transactions</span>
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Ledger Hub
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Record capital contributions, manage operating disbursements, and track comprehensive financial ledgers.
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl w-fit self-start sm:self-auto">
            {expenses.length} Expenses • {payments.length} Payments
          </div>
        </div>

        {/* 5 PRIMARY ACTIONS: RESPONSIVE GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 pt-2 border-t border-slate-100">
          {/* Action 1: Record a Payment */}
          <button
            type="button"
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-emerald-600/20 transition-all cursor-pointer text-center"
          >
            <PlusIcon className="h-4 w-4 shrink-0 text-emerald-200" />
            <span className="truncate">Record Payment</span>
          </button>

          {/* Action 2: Dividend Payout */}
          <button
            type="button"
            onClick={() => setIsDividendModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-purple-900/20 transition-all cursor-pointer text-center"
          >
            <BanknotesIcon className="h-4 w-4 shrink-0 text-purple-200" />
            <span className="truncate">Dividend Payout</span>
          </button>

          {/* Action 3: Record Expense */}
          <button
            type="button"
            onClick={() => {
              setExpenseToEdit(null);
              setIsExpenseModalOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-amber-400 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-slate-900/20 transition-all cursor-pointer text-center"
          >
            <PlusIcon className="h-4 w-4 shrink-0 text-amber-400" />
            <span className="truncate">Record Expense</span>
          </button>

          {/* Action 4: List Expenses */}
          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center border ${
              activeTab === 'expenses'
                ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-sm ring-2 ring-rose-500/20'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <ReceiptPercentIcon className="h-4 w-4 shrink-0 text-rose-500" />
            <span className="truncate">List Expenses</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-100 text-rose-800 font-mono">
              {expenses.length}
            </span>
          </button>

          {/* Action 5: List Payments */}
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center border ${
              activeTab === 'payments'
                ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <CreditCardIcon className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="truncate">List Payments</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-100 text-blue-800 font-mono">
              {payments.length}
            </span>
          </button>
        </div>
      </div>

      {/* PERIOD SELECTOR & SUMMARY BAR (CORE QUARTERLY FINANCIAL STATEMENTS FILTER) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 px-4 sm:px-6 py-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Year & Quarter Pickers */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm">
            <CalendarIcon className="h-4 w-4 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => {
                const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                setSelectedYear(val);
                setExpensesPage(1);
                setPaymentsPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="ALL">All Years</option>
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-sm">
            {['Q1', 'Q2', 'Q3', 'Q4', 'ALL'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  setSelectedQuarter(q);
                  setExpensesPage(1);
                  setPaymentsPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer ${
                  selectedQuarter === q
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {q === 'ALL' ? 'Full Year (YTD)' : q}
              </button>
            ))}
          </div>

          {(loadingExpenses || loadingPayments) && (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium ml-2">
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              Updating...
            </span>
          )}
        </div>

        {/* Quick Date Display & Reset */}
        <div className="flex items-center gap-3">
          <div className="text-[11px] text-slate-500 font-mono">
            Period: <span className="font-bold text-slate-700">{periodDisplay.start}</span> to{' '}
            <span className="font-bold text-slate-700">{periodDisplay.end}</span>
          </div>

          {(selectedYear !== currentYear || selectedQuarter !== defaultQuarter) && (
            <button
              type="button"
              onClick={() => {
                setSelectedYear(currentYear);
                setSelectedQuarter(defaultQuarter);
                setExpensesPage(1);
                setPaymentsPage(1);
              }}
              className="text-[10px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI STATS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Capital Inflows
            </span>
            <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-emerald-700">
            {formatUSD(totalPaymentsAmount)}
          </p>
          <span className="text-[10px] text-slate-500 block truncate" title={`All-time: ${formatUSD(allPaymentsTotal)}`}>
            {filteredPayments.length} investor payments {selectedQuarter !== 'ALL' || selectedYear !== 'ALL' ? `• All: ${formatUSD(allPaymentsTotal)}` : ''}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Operating Expenses
            </span>
            <ArrowTrendingDownIcon className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-rose-700">
            {formatUSD(totalExpensesAmount)}
          </p>
          <span className="text-[10px] text-slate-500 block truncate" title={`All-time: ${formatUSD(allExpensesTotal)}`}>
            {filteredExpenses.length} actual disbursements {selectedQuarter !== 'ALL' || selectedYear !== 'ALL' ? `• All: ${formatUSD(allExpensesTotal)}` : ''}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Net Inflow Balance
            </span>
            <ScaleIcon className="h-4 w-4 text-blue-500" />
          </div>
          <p className={`text-lg sm:text-xl font-black font-mono ${netCashFlow >= 0 ? 'text-blue-900' : 'text-rose-700'}`}>
            {formatUSD(netCashFlow)}
          </p>
          <span className="text-[10px] text-slate-500 block">
            Inflows less operating costs
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Transactions
            </span>
            <ArrowsRightLeftIcon className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-slate-900">
            {filteredExpenses.length + filteredPayments.length}
          </p>
          <span className="text-[10px] text-slate-500 block">
            {filteredExpenses.length} exp • {filteredPayments.length} pay
          </span>
        </div>
      </div>

      {/* LEDGER CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* VIEW SELECTOR TABS & SEARCH BAR */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tab Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'expenses'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ReceiptPercentIcon className="h-4 w-4" />
                <span>Operating Expenses</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  activeTab === 'expenses' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {filteredExpenses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'payments'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <CreditCardIcon className="h-4 w-4" />
                <span>Payments & Subscriptions</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                  activeTab === 'payments' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {filteredPayments.length}
                </span>
              </button>
            </div>

            {/* Refresh Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (activeTab === 'expenses') await reloadExpenses();
                  else await reloadPayments();
                  showToast('Ledger refreshed.', 'success');
                }}
                disabled={loadingExpenses || loadingPayments}
                className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                title="Refresh current ledger"
              >
                <ArrowPathIcon className={`h-4 w-4 ${(loadingExpenses || loadingPayments) ? 'animate-spin text-amber-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search & Dropdown Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'expenses'
                    ? 'Search expenses by vendor, description, category, opportunity...'
                    : 'Search payments by shareholder name, opportunity, description, ID...'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setExpensesPage(1);
                  setPaymentsPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setExpensesPage(1);
                    setPaymentsPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Opportunity Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shrink-0 shadow-xs">
              <BuildingOffice2Icon className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedOpportunityFilter}
                onChange={(e) => {
                  setSelectedOpportunityFilter(e.target.value);
                  setExpensesPage(1);
                  setPaymentsPage(1);
                }}
                className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-xs"
              >
                <option value="ALL">All Opportunities</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.name} {opp.type ? `(${opp.type})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter (when Payments tab active) */}
            {activeTab === 'payments' && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs shrink-0 shadow-xs">
                <span className="text-[10px] uppercase font-black text-slate-400">Status:</span>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    setPaymentsPage(1);
                  }}
                  className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="succeeded">Succeeded / Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed / Cancelled</option>
                  <option value="dividend">Dividends Only</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* LEDGER CONTENT AREA */}
        <div className="p-4 sm:p-6 overflow-x-auto">
          {/* TAB 1: OPERATING EXPENSES */}
          {activeTab === 'expenses' && (
            loadingExpenses ? (
              <div className="py-20 text-center space-y-3">
                <ArrowPathIcon className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Loading operating expenses...</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <ReceiptPercentIcon className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Operating Expenses Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || selectedOpportunityFilter !== 'ALL'
                    ? 'No expenses matched your filter criteria.'
                    : 'No operating expenses have been recorded yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setExpenseToEdit(null);
                    setIsExpenseModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-amber-400 hover:bg-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Record First Expense</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Opportunity</th>
                      <th className="px-3.5 py-2.5">Vendor / Payee</th>
                      <th className="px-3.5 py-2.5">Category</th>
                      <th className="px-3.5 py-2.5 text-right">Amount</th>
                      <th className="px-3.5 py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3.5 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                          {exp.expense_date}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className="font-bold text-slate-900 block max-w-[200px] truncate" title={exp.opportunities?.name}>
                            {exp.opportunities?.name || `Opportunity #${exp.opportunity_id || 'N/A'}`}
                          </span>
                          {exp.opportunities?.type && (
                            <span className="text-[10px] text-slate-400 block">
                              {exp.opportunities.type}
                            </span>
                          )}
                        </td>
                        <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap" title={exp.description || undefined}>
                          {exp.vendor || '—'}
                        </td>
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          {formatUSD(exp.amount)}
                        </td>
                        <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setExpenseToEdit(exp);
                                setIsExpenseModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Expense"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>

                            {/* Delete Button (Opens Delete Pop-Up Modal) */}
                            <button
                              type="button"
                              onClick={() => setExpenseToDelete(exp)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Expense"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={4} className="px-3.5 py-2.5 text-slate-700 uppercase">
                        Total ({filteredExpenses.length} disbursements)
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-black text-rose-700 text-sm">
                        {formatUSD(totalExpensesAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Expenses Pagination Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/80 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>
                      Showing{' '}
                      <span className="font-bold text-slate-800">
                        {filteredExpenses.length === 0 ? 0 : (expensesPage - 1) * expensesPageSize + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-bold text-slate-800">
                        {Math.min(expensesPage * expensesPageSize, filteredExpenses.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-bold text-slate-800">{filteredExpenses.length}</span>{' '}
                      expenses
                    </span>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-slate-400">Rows:</span>
                      <select
                        value={expensesPageSize}
                        onChange={(e) => {
                          setExpensesPageSize(Number(e.target.value));
                          setExpensesPage(1);
                        }}
                        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setExpensesPage((p) => Math.max(1, p - 1))}
                      disabled={expensesPage <= 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalExpensesPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalExpensesPages || Math.abs(p - expensesPage) <= 1)
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          return (
                            <span key={p} className="flex items-center">
                              {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                              <button
                                type="button"
                                onClick={() => setExpensesPage(p)}
                                className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-all ${
                                  expensesPage === p
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                {p}
                              </button>
                            </span>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpensesPage((p) => Math.min(totalExpensesPages, p + 1))}
                      disabled={expensesPage >= totalExpensesPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 2: PAYMENTS & SUBSCRIPTIONS */}
          {activeTab === 'payments' && (
            loadingPayments ? (
              <div className="py-20 text-center space-y-3">
                <ArrowPathIcon className="h-8 w-8 text-emerald-500 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-600">Loading payments ledger...</p>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <CreditCardIcon className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Payments Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery || selectedOpportunityFilter !== 'ALL' || paymentStatusFilter !== 'ALL'
                    ? 'No payments matched your filter criteria.'
                    : 'No investor payments have been recorded yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Record First Payment</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Date</th>
                      <th className="px-3.5 py-2.5">Shareholder / Investor</th>
                      <th className="px-3.5 py-2.5">Opportunity</th>
                      <th className="px-3.5 py-2.5">Type & Method</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Amount</th>
                      <th className="px-3.5 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedPayments.map((pay) => {
                      const status = (pay.status || '').toLowerCase();
                      const isPaid = ['succeeded', 'success', 'paid', 'complete', 'completed'].includes(status);
                      const isPending = ['pending', 'processing', 'incomplete'].includes(status);

                      return (
                        <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3.5 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                            {pay.created_at ? pay.created_at.split('T')[0] : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className="font-bold text-slate-900 block max-w-[200px] truncate">
                              {pay.shareholders?.fullName || 'Anonymous Investor'}
                            </span>
                            {pay.shareholders?.email && (
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {pay.shareholders.email}
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className="font-bold text-slate-800 block max-w-[200px] truncate">
                              {pay.opportunities?.name || `Opportunity #${pay.opportunity_id || 'N/A'}`}
                            </span>
                            {pay.opportunities?.type && (
                              <span className="text-[10px] text-slate-400 block">
                                {pay.opportunities.type}
                              </span>
                            )}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className="capitalize text-slate-700 font-medium block">
                              {pay.type === 'dividend' || pay.type === 'dividend_payout' ? (
                                <span className="font-bold text-purple-900">Dividend Payout</span>
                              ) : (
                                pay.type || 'Subscription'
                              )}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">
                              {pay.metadata?.payout_rail || pay.payment_method_type || 'Wire'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            {pay.type === 'dividend' || pay.type === 'dividend_payout' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-purple-50 text-purple-700 border border-purple-200">
                                <BanknotesIcon className="h-3 w-3 text-purple-600" />
                                <span>Disbursed</span>
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isPending
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isPaid ? (
                                  <CheckCircleIcon className="h-3 w-3 text-emerald-600" />
                                ) : isPending ? (
                                  <ClockIcon className="h-3 w-3 text-amber-600" />
                                ) : (
                                  <XCircleIcon className="h-3 w-3 text-rose-600" />
                                )}
                                <span>{pay.status || 'unknown'}</span>
                              </span>
                            )}
                          </td>
                          <td className={`px-3.5 py-2.5 text-right font-mono font-bold whitespace-nowrap ${
                            pay.type === 'dividend' || pay.type === 'dividend_payout' ? 'text-purple-700' : 'text-emerald-700'
                          }`}>
                            {pay.type === 'dividend' || pay.type === 'dividend_payout' ? `- ${formatUSD(pay.amount)}` : formatUSD(pay.amount)}
                          </td>
                          <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setViewedPayment(pay)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="View Payment Details"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                    <tr>
                      <td colSpan={5} className="px-3.5 py-2.5 text-slate-700 uppercase">
                        Total Capital ({filteredPayments.length} transactions)
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-700 text-sm">
                        {formatUSD(totalPaymentsAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Payments Pagination Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50/80 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>
                      Showing{' '}
                      <span className="font-bold text-slate-800">
                        {filteredPayments.length === 0 ? 0 : (paymentsPage - 1) * paymentsPageSize + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-bold text-slate-800">
                        {Math.min(paymentsPage * paymentsPageSize, filteredPayments.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-bold text-slate-800">{filteredPayments.length}</span>{' '}
                      payments
                    </span>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-slate-400">Rows:</span>
                      <select
                        value={paymentsPageSize}
                        onChange={(e) => {
                          setPaymentsPageSize(Number(e.target.value));
                          setPaymentsPage(1);
                        }}
                        className="bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}
                      disabled={paymentsPage <= 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPaymentsPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPaymentsPages || Math.abs(p - paymentsPage) <= 1)
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          return (
                            <span key={p} className="flex items-center">
                              {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                              <button
                                type="button"
                                onClick={() => setPaymentsPage(p)}
                                className={`min-w-[28px] h-7 rounded-lg text-xs font-bold transition-all ${
                                  paymentsPage === p
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                              >
                                {p}
                              </button>
                            </span>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPaymentsPage((p) => Math.min(totalPaymentsPages, p + 1))}
                      disabled={paymentsPage >= totalPaymentsPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <RecordPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          opportunities={opportunities}
          shareholders={shareholders}
          onPaymentAdded={async () => {
            await reloadPayments();
            setActiveTab('payments');
          }}
        />
      )}

      {/* RECORD DIVIDEND PAYOUT MODAL */}
      {isDividendModalOpen && (
        <RecordDividendPayoutModal
          isOpen={isDividendModalOpen}
          onClose={() => setIsDividendModalOpen(false)}
          opportunities={opportunities}
          shareholders={shareholders}
          onPayoutAdded={async () => {
            await reloadPayments();
            setActiveTab('payments');
          }}
        />
      )}

      {/* ADD / EDIT OPERATING EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <AddExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setExpenseToEdit(null);
          }}
          opportunities={opportunities}
          expenseToEdit={expenseToEdit}
          opportunityId={expenseToEdit?.opportunity_id || opportunities?.[0]?.id || 9}
          onExpenseAdded={async () => {
            await reloadExpenses();
            setActiveTab('expenses');
          }}
        />
      )}

      {/* DELETE EXPENSE CONFIRMATION POP UP MODAL */}
      {expenseToDelete && (
        <DeleteExpenseModal
          isOpen={!!expenseToDelete}
          expense={expenseToDelete}
          isDeleting={isDeletingExpense}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={handleConfirmDeleteExpense}
        />
      )}

      {/* VIEW PAYMENT DETAILS MODAL */}
      {viewedPayment && (
        <PaymentViewModal
          payment={viewedPayment}
          onClose={() => setViewedPayment(null)}
        />
      )}
    </div>
  );
}
