'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import UploadReportModal from './UploadReportModal';
import DeleteReportModal from './DeleteReportModal';
import QuarterlyFinancialStatementsModal from './QuarterlyFinancialStatementsModal';
import { deleteReportAction } from './actions';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
  CalendarDaysIcon,
  BuildingOffice2Icon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
} from '@heroicons/react/24/outline';

export default function ReportsClient({
  initialReports = [],
  opportunities = [],
  shareholders = [],
  isFinanceMode = false,
}) {
  const { showToast } = useToast();
  const [reports, setReports] = useState(initialReports);
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Categorize reports
  const financialReports = reports.filter((r) => 
    r.name?.includes('[General] Core') && 
    (r.name?.includes('Statement') || r.name?.includes('Balance Sheet') || r.name?.includes('Package'))
  );
  const opportunityReports = reports.filter((r) => !financialReports.some((f) => f.id === r.id));
  const totalGeneral = opportunityReports.filter((r) => r.category === 'GENERAL').length;
  const totalProject = opportunityReports.filter((r) => r.category === 'PROJECT').length;

  const matchesFinancialCategory = (reportName, filter) => {
    if (filter === 'ALL') return true;
    const name = (reportName || '').toLowerCase();
    if (filter === 'PACKAGE') return name.includes('package');
    if (filter === 'INCOME') return name.includes('income');
    if (filter === 'BALANCE') return name.includes('balance');
    if (filter === 'CASHFLOW') return name.includes('cash flow');
    if (filter === 'EQUITY') return name.includes('shareholders') || name.includes('equity');
    return true;
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    // 0. Finance Mode Filter
    const isFinancialReport = r.name?.includes('[General] Core') && 
      (r.name?.includes('Statement') || r.name?.includes('Balance Sheet') || r.name?.includes('Package'));
    
    if (isFinanceMode && !isFinancialReport) return false;
    if (!isFinanceMode && isFinancialReport) return false;

    // 1. Category Filter
    if (isFinanceMode) {
      if (!matchesFinancialCategory(r.name, filterCategory)) return false;
    } else {
      if (filterCategory !== 'ALL' && r.category !== filterCategory) {
        return false;
      }
    }

    // 2. Search Term Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const nameMatch = r.name?.toLowerCase().includes(q);
      const oppMatch = r.opportunities?.name?.toLowerCase().includes(q);
      const dateMatch = r.meetingDate?.includes(q) || r.monthLabel?.toLowerCase().includes(q);
      if (!nameMatch && !oppMatch && !dateMatch) return false;
    }

    return true;
  });

  // Group filtered reports by Calendar Month (YYYY-MM)
  const groupedByMonth = filteredReports.reduce((acc, report) => {
    const key = report.monthKey || 'Other';
    const label = report.monthLabel || 'Other Dates';

    if (!acc[key]) {
      acc[key] = {
        key,
        label,
        reports: [],
      };
    }
    acc[key].reports.push(report);
    return acc;
  }, {});

  // Sort months descending (newest month first)
  const sortedMonths = Object.values(groupedByMonth).sort((a, b) =>
    String(b.key || '').localeCompare(String(a.key || ''))
  );

  const handleReportAdded = (newReport) => {
    // Add new report with computed category/month
    const rawName = newReport.name || '';
    let category = 'GENERAL';
    if (rawName.toLowerCase().includes('[project]')) {
      category = 'PROJECT';
    } else if (rawName.toLowerCase().includes('[general]')) {
      category = 'GENERAL';
    }

    let dateObj = new Date(newReport.created_at);
    const dateMatch = rawName.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed.getTime())) dateObj = parsed;
    }

    const year = dateObj.getFullYear();
    const monthIndex = dateObj.getMonth();
    const formatted = {
      ...newReport,
      category,
      meetingDate: dateObj.toISOString().split('T')[0],
      monthKey: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      monthLabel: dateObj.toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    };

    setReports((prev) => [formatted, ...prev]);
  };

  const handleConfirmDelete = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deleteReportAction(reportToDelete.id, reportToDelete.storage_path);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        showToast('Report deleted successfully.', 'success');
        setReports((prev) => prev.filter((r) => r.id !== reportToDelete.id));
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete report.', 'error');
    } finally {
      setIsDeleting(false);
      setReportToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action Controls */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#000033] uppercase tracking-tight">
                {isFinanceMode ? (
                  <>Financial <span className="text-blue-600">Reports</span></>
                ) : (
                  <>Opportunity <span className="text-blue-600">Reports</span></>
                )}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                {isFinanceMode ? 'Financial Statements' : 'Meeting Minutes'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {isFinanceMode 
                ? 'Official quarterly financial statements for Core Portfolio Equity.'
                : 'Monthly minutes for core opportunity and weekly minutes for project opportunities stored in Supabase.'}
            </p>
          </div>

          {/* Header Action Button */}
          <div className="shrink-0 flex items-center gap-2.5">
            {isFinanceMode ? (
              <button
                type="button"
                onClick={() => setIsFinancialModalOpen(true)}
                className="px-4 py-2.5 bg-[#000033] hover:bg-blue-950 text-amber-400 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg border border-amber-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                title="Generate, review and download official quarterly financial statements for Core Portfolio Equity"
              >
                <BanknotesIcon className="h-4 w-4 text-amber-400" />
                <span>Core Statements</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Attach New Report</span>
              </button>
            )}
          </div>
        </div>

        {/* Separated Search Bar */}
        <div className="pt-3 border-t border-slate-100">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                isFinanceMode
                  ? 'Search financial statements by title, period, or keyword...'
                  : 'Search reports or opportunities by name, date, or tag...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold bg-slate-200 hover:bg-slate-300 rounded-full h-5 w-5 flex items-center justify-center transition-colors cursor-pointer"
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs Filter Row */}
        <div className="pt-1 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {isFinanceMode ? (
            <>
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  filterCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Statements ({financialReports.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('PACKAGE')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  filterCategory === 'PACKAGE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                Complete Package
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('INCOME')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  filterCategory === 'INCOME'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
                }`}
              >
                Income Statement
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('BALANCE')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  filterCategory === 'BALANCE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                Balance Sheet
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('CASHFLOW')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  filterCategory === 'CASHFLOW'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
                }`}
              >
                Cash Flows
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('EQUITY')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  filterCategory === 'EQUITY'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200/60'
                }`}
              >
                Shareholders' Equity
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFilterCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  filterCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Reports ({opportunityReports.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('GENERAL')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  filterCategory === 'GENERAL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
                }`}
              >
                <span>General (Monthly)</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 font-mono">
                  {totalGeneral}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterCategory('PROJECT')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  filterCategory === 'PROJECT'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                <span>Project (Weekly)</span>
                <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white/20 font-mono">
                  {totalProject}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reports by Calendar Month */}
      {sortedMonths.length === 0 ? (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            {isFinanceMode ? <BanknotesIcon className="h-8 w-8" /> : <ClipboardDocumentListIcon className="h-8 w-8" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {isFinanceMode ? 'No Financial Statements Found' : 'No Reports Found'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchTerm || filterCategory !== 'ALL'
                ? isFinanceMode 
                  ? 'No statements match your selected filter or search keyword.'
                  : 'No reports match your selected category or search filter.'
                : isFinanceMode
                ? 'Click "Core Quarterly Statements" to generate and archive official financial statements for this fund.'
                : 'Click "Attach New Report" to upload and link meeting minutes to an opportunity.'}
            </p>
          </div>
          {isFinanceMode ? (
            <button
              type="button"
              onClick={() => setIsFinancialModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#000033] hover:bg-blue-950 text-amber-400 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              <BanknotesIcon className="h-4 w-4 text-amber-400" />
              <span>Generate Core Statements</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Attach First Report</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {sortedMonths.map((monthGroup) => (
            <section key={monthGroup.key} className="space-y-3">
              {/* Calendar Month Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-slate-200/70 text-slate-700 rounded-lg">
                    <CalendarDaysIcon className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    {monthGroup.label}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    {monthGroup.reports.length} {isFinanceMode ? (monthGroup.reports.length === 1 ? 'statement' : 'statements') : (monthGroup.reports.length === 1 ? 'report' : 'reports')}
                  </span>
                </div>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monthGroup.reports.map((report) => {
                  const isGeneral = report.category === 'GENERAL';
                  
                  let statementBadgeLabel = 'Quarterly Statement';
                  if (isFinanceMode) {
                    const lowerName = (report.name || '').toLowerCase();
                    if (lowerName.includes('package')) statementBadgeLabel = '4-Statement Package';
                    else if (lowerName.includes('income')) statementBadgeLabel = 'Income Statement';
                    else if (lowerName.includes('balance')) statementBadgeLabel = 'Balance Sheet';
                    else if (lowerName.includes('cash flow')) statementBadgeLabel = 'Cash Flows';
                    else if (lowerName.includes('shareholders') || lowerName.includes('equity')) statementBadgeLabel = "Shareholders' Equity";
                  }

                  return (
                    <div
                      key={report.id}
                      className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        {/* Badges Bar */}
                        <div className="flex items-center justify-between gap-2">
                          {isFinanceMode ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-amber-50 text-amber-800 border-amber-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                              {statementBadgeLabel}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                isGeneral
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isGeneral ? 'bg-blue-600' : 'bg-emerald-600'
                                }`}
                              />
                              {report.category}
                              <span className="opacity-60 text-[8px] font-semibold">
                                ({isGeneral ? 'Monthly' : 'Weekly'})
                              </span>
                            </span>
                          )}

                          <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                            <ClockIcon className="h-3 w-3 text-slate-400" />
                            {report.meetingDate}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          className="font-bold text-slate-900 text-sm leading-snug break-words"
                          title={report.name}
                        >
                          {report.name}
                        </h3>

                        {/* Linked Opportunity */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <BuildingOffice2Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">
                            {report.opportunities?.name || 'Unlinked Opportunity'}
                          </span>
                          {report.opportunities?.type && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                              {report.opportunities.type}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <a
                          href={report.viewUrl || report.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="View / Download in Supabase Storage"
                        >
                          <DocumentTextIcon className="h-3.5 w-3.5" />
                          <span>View Document</span>
                          <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        </a>

                        <button
                          type="button"
                          onClick={() => setReportToDelete(report)}
                          title="Delete Report"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Upload Report Modal */}
      {isModalOpen && (
        <UploadReportModal
          opportunities={opportunities}
          onClose={() => setIsModalOpen(false)}
          onReportAdded={handleReportAdded}
        />
      )}

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <DeleteReportModal
          isOpen={Boolean(reportToDelete)}
          report={reportToDelete}
          isDeleting={isDeleting}
          onClose={() => setReportToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Core Quarterly Financial Statements Modal */}
      {isFinancialModalOpen && (
        <QuarterlyFinancialStatementsModal
          isOpen={isFinancialModalOpen}
          onClose={() => setIsFinancialModalOpen(false)}
          opportunities={opportunities}
          shareholders={shareholders}
          onReportArchived={(report) => {
            handleReportAdded(report);
          }}
        />
      )}
    </div>
  );
}
