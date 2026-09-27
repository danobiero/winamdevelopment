'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import {
  XMarkIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  BookmarkSquareIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BanknotesIcon,
  ScaleIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  getCoreQuarterlyFinancials,
  saveQuarterlyFinancialStatementReportAction,
} from './actions';
import { generateCoreQuarterlyStatementPDF } from '@/app/_lib/pdf/generateCoreQuarterlyStatementPDF';
import AddExpenseModal from './AddExpenseModal';

const formatUSD = (amount) => {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function QuarterlyFinancialStatementsModal({
  isOpen,
  onClose,
  onReportArchived,
  opportunities = [],
  shareholders: shareholdersList = [],
}) {
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
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
  // Statements tabs: 'PACKAGE' | 'INCOME' | 'BALANCE' | 'CASHFLOW' | 'EQUITY'
  const [activeTab, setActiveTab] = useState('PACKAGE');

  const [statementData, setStatementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Add / Edit Expense modal state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // Load statement data
  async function loadData() {
    setLoading(true);
    setError(null);
    setArchiveSuccess('');

    try {
      const res = await getCoreQuarterlyFinancials({
        year: selectedYear,
        quarter: selectedQuarter,
      });

      if (res?.error) {
        setError(res.error);
        showToast(res.error, 'error');
        setStatementData(null);
      } else {
        setStatementData(res.data);
      }
    } catch (err) {
      const msg = err.message || 'Failed to load financial statements.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, selectedYear, selectedQuarter]);

  if (!isOpen) return null;

  // Resolve current statement type for PDF generation
  const getStatementTypeParam = (tab) => {
    switch (tab) {
      case 'INCOME':
        return 'INCOME_STATEMENT';
      case 'BALANCE':
        return 'BALANCE_SHEET';
      case 'CASHFLOW':
        return 'CASH_FLOW';
      case 'EQUITY':
        return 'SHAREHOLDERS_EQUITY';
      default:
        return 'ALL';
    }
  };

  const getStatementLabel = (tab) => {
    switch (tab) {
      case 'INCOME':
        return 'Income Statement';
      case 'BALANCE':
        return 'Balance Sheet';
      case 'CASHFLOW':
        return 'Statement of Cash Flows';
      case 'EQUITY':
        return "Statement of Shareholders' Equity";
      default:
        return 'Complete 4-Statement Package';
    }
  };

  // Download PDF
  const handleDownloadPDF = async (forceType = null) => {
    if (!statementData) return;
    try {
      setIsDownloading(true);
      const type = forceType || getStatementTypeParam(activeTab);
      await generateCoreQuarterlyStatementPDF(statementData, {
        download: true,
        statementType: type,
      });
      showToast('PDF statement downloaded successfully.', 'success');
    } catch (err) {
      console.error('PDF download error:', err);
      showToast('Failed to generate PDF: ' + err.message, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Archive Statement to Opportunity Documents
  const handleArchiveReport = async (forceType = null) => {
    if (!statementData) return;
    try {
      setIsArchiving(true);
      setArchiveSuccess('');

      const type = forceType || getStatementTypeParam(activeTab);
      const pdfBlob = await generateCoreQuarterlyStatementPDF(statementData, {
        download: false,
        returnBlob: true,
        statementType: type,
      });

      if (!pdfBlob) throw new Error('Could not generate statement PDF blob');

      const label = getStatementLabel(type === 'ALL' ? 'PACKAGE' : activeTab);
      const safeTitle = `[General] Core ${label} - ${selectedYear} ${selectedQuarter}.pdf`;
      const fileName = `Core_${type}_${selectedYear}_${selectedQuarter}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('opportunityId', statementData.opportunity.id);
      formData.append('year', String(selectedYear));
      formData.append('quarter', selectedQuarter);
      formData.append('statementType', type);
      formData.append('title', safeTitle);
      formData.append('file', file);

      const res = await saveQuarterlyFinancialStatementReportAction(formData);

      if (res?.error) throw new Error(res.error);

      setArchiveSuccess(`Archived ${label} to Reports!`);
      showToast(`Archived ${label} to Reports!`, 'success');
      if (onReportArchived && res?.report) {
        onReportArchived(res.report);
      }
    } catch (err) {
      console.error('Archive error:', err);
      let errMsg = err.message;
      if (errMsg.includes('unique_document_per_opportunity')) {
        errMsg = 'This quarterly statement has already been archived for this period. Please delete the existing report first if you wish to replace it.';
      }
      showToast('Failed to archive statement: ' + errMsg, 'error');
    } finally {
      setIsArchiving(false);
    }
  };

  const metrics = statementData?.metrics;
  const balanceSheet = statementData?.balanceSheet;
  const incomeStatement = statementData?.incomeStatement;
  const cashFlow = statementData?.cashFlow;
  const shareholdersEquity = statementData?.shareholdersEquity;
  const actualExpenses = statementData?.actualExpenses || [];
  const transactions = statementData?.periodTransactions || [];
  const shareholders = shareholdersEquity?.shareholderSchedule || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] my-auto">
        {/* MODAL HEADER */}
        <div className="bg-[#000033] text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Core Portfolio Equity
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Opportunity #{statementData?.opportunity?.id || 9}
              </span>
              {statementData?.isUsingTableExpenses && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Actual Expenses Connected
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <BanknotesIcon className="h-6 w-6 text-amber-400" />
              <span>Core Quarterly Financial Statements</span>
            </h2>
            <p className="text-xs text-slate-300">
              Winam Development Group • Income Statement, Balance Sheet, Statement of Cash Flows & Shareholders' Equity.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors self-end sm:self-auto"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* PERIOD SELECTOR & SUMMARY BAR */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Year & Quarter Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-sm">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
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
                  onClick={() => setSelectedQuarter(q)}
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

            {loading && (
              <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium ml-2">
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                Updating Statements...
              </span>
            )}
          </div>

          {/* Quick Date Display */}
          <div className="flex items-center gap-3">
            {statementData?.period && (
              <div className="text-[11px] text-slate-500 font-mono">
                Period: <span className="font-bold text-slate-700">{statementData.period.startDate}</span> to{' '}
                <span className="font-bold text-slate-700">{statementData.period.endDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* TOP STATEMENTS NAVIGATION TABS */}
        <div className="px-4 sm:px-6 pt-2 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('PACKAGE')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'PACKAGE'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>Complete Package</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INCOME')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'INCOME'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BanknotesIcon className="h-4 w-4" />
            <span>1. Income Statement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BALANCE')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BALANCE'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ScaleIcon className="h-4 w-4" />
            <span>2. Balance Sheet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CASHFLOW')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CASHFLOW'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowTrendingUpIcon className="h-4 w-4" />
            <span>3. Cash Flows</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('EQUITY')}
            className={`pb-2.5 px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'EQUITY'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserGroupIcon className="h-4 w-4" />
            <span>4. Shareholders' Equity</span>
          </button>
        </div>

        {/* TAB CONTENT */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {loading && (
            <div className="py-20 text-center space-y-3">
              <ArrowPathIcon className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                Compiling Core Financial Statements...
              </p>
              <p className="text-xs text-slate-400">
                Aggregating Income Statement, Balance Sheet, Cash Flows, and Equity for {selectedYear} {selectedQuarter}.
              </p>
            </div>
          )}

          {!loading && statementData && (
            <>
              {/* ========================================================= */}
              {/* 1. COMPLETE PACKAGE OVERVIEW */}
              {/* ========================================================= */}
              {activeTab === 'PACKAGE' && (
                <div className="space-y-6">
                  {/* Top KPI Highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Target Capital
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        {formatUSD(metrics?.targetCapitalization)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Core Portfolio Target</span>
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                        Cumulative Capital
                      </span>
                      <span className="text-base sm:text-lg font-black text-amber-900 font-mono">
                        {formatUSD(metrics?.cumulativeCapitalRaised)}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 block">
                        {(metrics?.fundingProgressPercent || 0).toFixed(1)}% funded
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                        Quarter Inflows
                      </span>
                      <span className="text-base sm:text-lg font-black text-emerald-900 font-mono">
                        {formatUSD(metrics?.periodInflows)}
                      </span>
                      <span className="text-[10px] text-emerald-700 block">
                        {metrics?.transactionCount || 0} subscriptions
                      </span>
                    </div>

                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                        Operating Expenses
                      </span>
                      <span className="text-base sm:text-lg font-black text-rose-900 font-mono">
                        {formatUSD(metrics?.totalExpenses)}
                      </span>
                      <span className="text-[10px] text-rose-700 block">
                        {statementData.isUsingTableExpenses ? `${actualExpenses.length} table records` : 'Calculated gateway'}
                      </span>
                    </div>
                  </div>

                  {/* Cards linking each statement */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setActiveTab('INCOME')}
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                          <BanknotesIcon className="h-4 w-4" />
                          <span>1. Income Statement</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">View Full &rarr;</span>
                      </div>
                      <div className="text-xs space-y-1 pt-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Total Revenues / Inflows:</span>
                          <span className="font-mono font-bold text-slate-900">{formatUSD(incomeStatement?.totalRevenues)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Operating Expenses / Costs:</span>
                          <span className="font-mono text-rose-600">-{formatUSD(incomeStatement?.totalExpenses)}</span>
                        </div>
                        <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-100">
                          <span>Net Operating Income:</span>
                          <span className="font-mono text-emerald-600">{formatUSD(incomeStatement?.netIncome)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab('BALANCE')}
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 shadow-sm hover:shadow transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                          <ScaleIcon className="h-4 w-4" />
                          <span>2. Balance Sheet</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">View Full &rarr;</span>
                      </div>
                      <div className="text-xs space-y-1 pt-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Total Assets (Cash Vault):</span>
                          <span className="font-mono font-bold text-slate-900">{formatUSD(balanceSheet?.totalAssets)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Total Liabilities:</span>
                          <span className="font-mono">{formatUSD(balanceSheet?.totalLiabilities)}</span>
                        </div>
                        <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-100">
                          <span>Shareholders' Equity:</span>
                          <span className="font-mono text-blue-600">{formatUSD(balanceSheet?.totalShareholderEquity)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab('CASHFLOW')}
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-500 shadow-sm hover:shadow transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-teal-700 uppercase tracking-wider flex items-center gap-1.5">
                          <ArrowTrendingUpIcon className="h-4 w-4" />
                          <span>3. Statement of Cash Flows</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">View Full &rarr;</span>
                      </div>
                      <div className="text-xs space-y-1 pt-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Operating Cash Flows:</span>
                          <span className="font-mono">{formatUSD(cashFlow?.netOperatingCash)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Financing Cash Flows:</span>
                          <span className="font-mono text-emerald-600">+{formatUSD(cashFlow?.netFinancingCash)}</span>
                        </div>
                        <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-100">
                          <span>Ending Vault Cash Balance:</span>
                          <span className="font-mono text-teal-700">{formatUSD(cashFlow?.endingCash)}</span>
                        </div>
                      </div>
                    </div>

                    <div
                      onClick={() => setActiveTab('EQUITY')}
                      className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-500 shadow-sm hover:shadow transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                          <UserGroupIcon className="h-4 w-4" />
                          <span>4. Shareholders' Equity</span>
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">View Full &rarr;</span>
                      </div>
                      <div className="text-xs space-y-1 pt-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Beginning Equity Balance:</span>
                          <span className="font-mono">{formatUSD(shareholdersEquity?.rollforward?.totalBeginningEquity)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Quarter Capital Inflows:</span>
                          <span className="font-mono text-emerald-600">+{formatUSD(shareholdersEquity?.rollforward?.periodContributions)}</span>
                        </div>
                        <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-100">
                          <span>Total Ending Equity:</span>
                          <span className="font-mono text-purple-700">{formatUSD(shareholdersEquity?.rollforward?.totalEndingEquity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. DEDICATED: INCOME STATEMENT */}
              {/* ========================================================= */}
              {activeTab === 'INCOME' && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
                  <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <BanknotesIcon className="h-5 w-5 text-emerald-600" />
                        <span>Statement of Comprehensive Income / Operations</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {incomeStatement?.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setExpenseToEdit(null);
                        setIsAddExpenseOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-xl font-bold text-xs bg-slate-900 text-amber-400 hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                      <span>Record Expense</span>
                    </button>
                  </div>

                  {/* Revenues */}
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Capital Revenues & Subscription Inflows
                    </span>
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                      {incomeStatement?.revenues?.map((r, i) => (
                        <div key={i} className="flex justify-between p-3">
                          <span className="text-slate-700">{r.label}</span>
                          <span className="font-mono font-medium text-slate-900">{formatUSD(r.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-900">
                        <span>Total Revenues / Inflows</span>
                        <span className="font-mono">{formatUSD(incomeStatement?.totalRevenues)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Operating Expenses & Transaction Processing
                      </span>
                      {statementData?.isUsingTableExpenses ? (
                        <span className="text-[10px] text-emerald-700 font-bold">
                          ✓ From operating_expenses table ({actualExpenses.length} records)
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-600 font-medium">
                          Estimated Gateway Processing Fees
                        </span>
                      )}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                      {incomeStatement?.expenses?.map((e, i) => (
                        <div key={i} className="flex justify-between p-3">
                          <span className="text-slate-700">{e.label}</span>
                          <span className="font-mono font-medium text-slate-900">{formatUSD(e.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-900">
                        <span>Total Operating Expenses</span>
                        <span className="font-mono text-rose-600">-{formatUSD(incomeStatement?.totalExpenses)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Result */}
                  <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wider block">
                        Net Operating Income / Surplus
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        Available for portfolio reinvestment or equity accrual
                      </span>
                    </div>
                    <span className="text-base sm:text-xl font-black font-mono text-emerald-900">
                      {formatUSD(incomeStatement?.netIncome)}
                    </span>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. DEDICATED: BALANCE SHEET */}
              {/* ========================================================= */}
              {activeTab === 'BALANCE' && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
                  <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <ScaleIcon className="h-5 w-5 text-blue-600" />
                        <span>Statement of Financial Position (Balance Sheet)</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        As of {balanceSheet?.asOfDate}
                      </p>
                    </div>

                    {balanceSheet?.isBalanced && (
                      <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Balanced: Assets = Liabilities + Equity
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Current Assets
                        </span>
                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                          {balanceSheet?.currentAssets?.map((a, i) => (
                            <div key={i} className="flex justify-between p-3">
                              <span className="text-slate-700">{a.label}</span>
                              <span className="font-mono font-medium text-slate-900">{formatUSD(a.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-900">
                            <span>Total Current Assets</span>
                            <span className="font-mono">{formatUSD(balanceSheet?.totalCurrentAssets)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                        <span>TOTAL ASSETS</span>
                        <span className="font-mono text-sm">{formatUSD(balanceSheet?.totalAssets)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Current Liabilities
                        </span>
                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                          {balanceSheet?.currentLiabilities?.map((l, i) => (
                            <div key={i} className="flex justify-between p-3">
                              <span className="text-slate-700">{l.label}</span>
                              <span className="font-mono font-medium text-slate-900">{formatUSD(l.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-900">
                            <span>Total Current Liabilities</span>
                            <span className="font-mono">{formatUSD(balanceSheet?.totalLiabilities)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Shareholders' Equity
                        </span>
                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                          {balanceSheet?.equity?.map((e, i) => (
                            <div key={i} className="flex justify-between p-3">
                              <span className="text-slate-700">{e.label}</span>
                              <span className="font-mono font-medium text-slate-900">{formatUSD(e.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-900">
                            <span>Total Shareholders' Equity</span>
                            <span className="font-mono text-blue-700">{formatUSD(balanceSheet?.totalShareholderEquity)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center text-xs font-black text-blue-950">
                        <span>TOTAL LIABILITIES & EQUITY</span>
                        <span className="font-mono text-sm">{formatUSD(balanceSheet?.totalLiabilitiesAndEquity)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 4. DEDICATED: STATEMENT OF CASH FLOWS */}
              {/* ========================================================= */}
              {activeTab === 'CASHFLOW' && (
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
                  <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <ArrowTrendingUpIcon className="h-5 w-5 text-teal-600" />
                        <span>Statement of Cash Flows</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {cashFlow?.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                      <span className="font-black text-slate-800 uppercase tracking-wider block">
                        1. Cash Flows from Operating Activities
                      </span>
                      {cashFlow?.operatingActivities?.map((o, i) => (
                        <div key={i} className="flex justify-between text-slate-600 pl-2">
                          <span>{o.label}</span>
                          <span className="font-mono">{formatUSD(o.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                        <span>Net Cash Provided by Operating Activities</span>
                        <span className="font-mono text-teal-700">{formatUSD(cashFlow?.netOperatingCash)}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                      <span className="font-black text-slate-800 uppercase tracking-wider block">
                        2. Cash Flows from Investing Activities
                      </span>
                      {cashFlow?.investingActivities?.map((inv, i) => (
                        <div key={i} className="flex justify-between text-slate-600 pl-2">
                          <span>{inv.label}</span>
                          <span className="font-mono">{formatUSD(inv.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                        <span>Net Cash Used in Investing Activities</span>
                        <span className="font-mono">{formatUSD(cashFlow?.netInvestingCash)}</span>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs">
                      <span className="font-black text-slate-800 uppercase tracking-wider block">
                        3. Cash Flows from Financing Activities
                      </span>
                      {cashFlow?.financingActivities?.map((f, i) => (
                        <div key={i} className="flex justify-between text-slate-600 pl-2">
                          <span>{f.label}</span>
                          <span className="font-mono">{formatUSD(f.amount)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
                        <span>Net Cash Provided by Financing Activities</span>
                        <span className="font-mono text-emerald-700">{formatUSD(cashFlow?.netFinancingCash)}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 space-y-2 text-xs">
                      <div className="flex justify-between font-bold text-teal-950">
                        <span>Net Increase / (Decrease) in Cash and Cash Equivalents:</span>
                        <span className="font-mono">{formatUSD(cashFlow?.netCashChange)}</span>
                      </div>
                      <div className="flex justify-between text-teal-800">
                        <span>Cash and Cash Equivalents at Beginning of Period:</span>
                        <span className="font-mono">{formatUSD(cashFlow?.beginningCash)}</span>
                      </div>
                      <div className="flex justify-between font-black text-teal-950 pt-2 border-t border-teal-200 text-sm">
                        <span>CASH AND CASH EQUIVALENTS AT END OF PERIOD:</span>
                        <span className="font-mono text-base">{formatUSD(cashFlow?.endingCash)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 5. DEDICATED: STATEMENT OF SHAREHOLDERS' EQUITY */}
              {/* ========================================================= */}
              {activeTab === 'EQUITY' && (
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
                    <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <UserGroupIcon className="h-5 w-5 text-purple-600" />
                          <span>Statement of Shareholders' Equity</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          {shareholdersEquity?.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden text-xs">
                      <div className="flex justify-between p-3">
                        <span className="text-slate-700">Beginning Contributed Share Capital</span>
                        <span className="font-mono font-medium text-slate-900">
                          {formatUSD(shareholdersEquity?.rollforward?.beginningContributedCapital)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3">
                        <span className="text-slate-700">Add: Additional Capital Contributions Received</span>
                        <span className="font-mono text-emerald-600 font-bold">
                          +{formatUSD(shareholdersEquity?.rollforward?.periodContributions)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3">
                        <span className="text-slate-700">Less: Capital Redemptions Paid</span>
                        <span className="font-mono text-rose-600">
                          {formatUSD(-shareholdersEquity?.rollforward?.periodRedemptions)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 font-bold text-slate-900">
                        <span>Ending Contributed Share Capital</span>
                        <span className="font-mono">
                          {formatUSD(shareholdersEquity?.rollforward?.endingContributedCapital)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3">
                        <span className="text-slate-700">Retained Operating Surplus / Reserves (Period End)</span>
                        <span className="font-mono font-medium">
                          {formatUSD(shareholdersEquity?.rollforward?.endingRetainedSurplus)}
                        </span>
                      </div>
                      <div className="flex justify-between p-3.5 bg-purple-50 font-black text-purple-950 text-sm">
                        <span>TOTAL ENDING SHAREHOLDERS' EQUITY</span>
                        <span className="font-mono text-base">
                          {formatUSD(shareholdersEquity?.rollforward?.totalEndingEquity)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shareholder Register */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        Shareholder Ownership Register & Allocation Schedule
                      </h4>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                        {shareholders.length} Registered Investors
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-3.5 py-2.5">#</th>
                            <th className="px-3.5 py-2.5">Shareholder</th>
                            <th className="px-3.5 py-2.5">Email</th>
                            <th className="px-3.5 py-2.5 text-right">Quarter Inflow</th>
                            <th className="px-3.5 py-2.5 text-right">Ending Contributed</th>
                            <th className="px-3.5 py-2.5 text-right">Fund Ownership %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {shareholders.map((sh, idx) => (
                            <tr key={sh.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-3.5 py-2.5 font-mono text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="px-3.5 py-2.5 font-bold text-slate-900">
                                {sh.name}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600">
                                {sh.email}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono font-semibold text-emerald-700">
                                {formatUSD(sh.periodContributions)}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900">
                                {formatUSD(sh.endingBalance)}
                              </td>
                              <td className="px-3.5 py-2.5 text-right font-mono font-bold text-purple-700">
                                {sh.ownershipPercent}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
                          <tr>
                            <td colSpan={3} className="px-3.5 py-2.5 text-slate-700 uppercase">
                              Total Active Capital
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-black text-emerald-700">
                              {formatUSD(metrics?.periodInflows)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900 text-sm">
                              {formatUSD(metrics?.cumulativeCapitalRaised)}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-black text-purple-900">
                              100.00%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {archiveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <CheckCircleIcon className="h-4 w-4" />
                {archiveSuccess}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Close
            </button>

            {/* Archive to Reports button */}
            <button
              type="button"
              onClick={() => handleArchiveReport()}
              disabled={loading || isArchiving || !statementData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              title={`Archive ${getStatementLabel(activeTab)} to Opportunity Reports`}
            >
              {isArchiving ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <BookmarkSquareIcon className="h-4 w-4 text-amber-400" />
              )}
              <span>
                {isArchiving
                  ? 'Archiving...'
                  : activeTab === 'PACKAGE'
                  ? 'Archive Full Package'
                  : `Archive ${getStatementLabel(activeTab)}`}
              </span>
            </button>

            {/* Download Complete Package Option if on individual statement */}
            {activeTab !== 'PACKAGE' && (
              <button
                type="button"
                onClick={() => handleDownloadPDF('ALL')}
                disabled={loading || isDownloading || !statementData}
                className="px-3.5 py-2 bg-white border border-amber-400 hover:bg-amber-50 text-amber-900 font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                title="Download all 4 core statements combined in one comprehensive package"
              >
                <DocumentArrowDownIcon className="h-4 w-4 text-amber-600" />
                <span>Download Full Package</span>
              </button>
            )}

            {/* Download Current Statement Button */}
            <button
              type="button"
              onClick={() => handleDownloadPDF()}
              disabled={loading || isDownloading || !statementData}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {isDownloading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <DocumentArrowDownIcon className="h-4 w-4" />
              )}
              <span>
                {isDownloading
                  ? 'Generating PDF...'
                  : activeTab === 'PACKAGE'
                  ? 'Download Complete Package (PDF)'
                  : `Download ${getStatementLabel(activeTab)} (PDF)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Nested Add / Edit Expense Modal */}
      {isAddExpenseOpen && (
        <AddExpenseModal
          isOpen={isAddExpenseOpen}
          onClose={() => {
            setIsAddExpenseOpen(false);
            setExpenseToEdit(null);
          }}
          opportunities={opportunities}
          opportunityId={expenseToEdit?.opportunity_id || statementData?.opportunity?.id || opportunities?.[0]?.id || 9}
          expenseToEdit={expenseToEdit}
          onExpenseAdded={async () => {
            await loadData();
          }}
        />
      )}
    </div>
  );
}
