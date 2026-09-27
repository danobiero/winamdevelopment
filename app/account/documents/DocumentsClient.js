'use client';

import { useState, useMemo } from 'react';
import {
  CalendarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  DocumentIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/solid';

function parseDocumentPeriod(doc) {
  const rawName = doc.name || '';

  // 1. Match YYYY Q[1-4] in filename (e.g. "2026 Q3")
  const quarterMatch = rawName.match(/(\d{4})\s*Q([1-4])/i);
  if (quarterMatch) {
    return {
      year: Number(quarterMatch[1]),
      quarter: `Q${quarterMatch[2]}`,
      dateStr: `${quarterMatch[1]}-Q${quarterMatch[2]}`,
    };
  }

  // 2. Match YYYY-MM-DD in filename (e.g. "2026-09-05")
  const dateMatch = rawName.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const yr = Number(dateMatch[1]);
    const mo = Number(dateMatch[2]);
    let q = 'Q1';
    if (mo >= 4 && mo <= 6) q = 'Q2';
    else if (mo >= 7 && mo <= 9) q = 'Q3';
    else if (mo >= 10 && mo <= 12) q = 'Q4';
    return {
      year: yr,
      quarter: q,
      dateStr: dateMatch[0],
    };
  }

  // 3. Fallback to created_at timestamp
  const dateObj = new Date(doc.created_at || Date.now());
  const yr = dateObj.getFullYear();
  const mo = dateObj.getMonth() + 1;
  let q = 'Q1';
  if (mo >= 4 && mo <= 6) q = 'Q2';
  else if (mo >= 7 && mo <= 9) q = 'Q3';
  else if (mo >= 10 && mo <= 12) q = 'Q4';
  return {
    year: yr,
    quarter: q,
    dateStr: dateObj.toISOString().split('T')[0],
  };
}

export default function DocumentsClient({ initialDocuments = [] }) {
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
  const [searchQuery, setSearchQuery] = useState('');

  // Discover available years from documents dataset
  const availableYears = useMemo(() => {
    const yearsSet = new Set([currentYear, currentYear - 1, currentYear - 2]);
    initialDocuments.forEach((doc) => {
      const info = parseDocumentPeriod(doc);
      if (info?.year) yearsSet.add(info.year);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [initialDocuments, currentYear]);

  // Compute period start and end date label
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

  // Filter documents reactively by Year, Quarter, and Search Query
  const filteredDocuments = useMemo(() => {
    return initialDocuments.filter((doc) => {
      const info = parseDocumentPeriod(doc);

      // 1. Year Filter
      if (selectedYear !== 'ALL' && info.year !== Number(selectedYear)) {
        return false;
      }

      // 2. Quarter Filter
      if (selectedQuarter !== 'ALL' && info.quarter !== selectedQuarter) {
        return false;
      }

      // 3. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const docName = (doc.name || '').toLowerCase();
        const oppName = (doc.opportunities?.name || '').toLowerCase();
        return docName.includes(q) || oppName.includes(q);
      }

      return true;
    });
  }, [initialDocuments, selectedYear, selectedQuarter, searchQuery]);

  const isFiltered =
    selectedYear !== currentYear || selectedQuarter !== defaultQuarter || searchQuery.trim() !== '';

  const handleResetFilter = () => {
    setSelectedYear(currentYear);
    setSelectedQuarter(defaultQuarter);
    setSearchQuery('');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Your <span className="text-blue-600 dark:text-blue-400">Documents</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-1">
            Access official agreements, prospectus files, and reports associated with your investments.
          </p>
        </div>

        <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl shrink-0 w-fit">
          {filteredDocuments.length} of {initialDocuments.length} Documents
        </div>
      </header>

      {/* PERIOD SELECTOR & SUMMARY BAR (CORE QUARTERLY FINANCIAL STATEMENTS FILTER) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Year & Quarter Pickers */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-xs">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => {
                  const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                  setSelectedYear(val);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Quarter Pills */}
            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5 shadow-xs">
              {['Q1', 'Q2', 'Q3', 'Q4', 'ALL'].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider transition-all cursor-pointer ${
                    selectedQuarter === q
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {q === 'ALL' ? 'Full Year (YTD)' : q}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Date Display & Reset */}
          <div className="flex items-center gap-3">
            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl">
              Period: <span className="font-bold text-slate-800">{periodDisplay.start}</span> to{' '}
              <span className="font-bold text-slate-800">{periodDisplay.end}</span>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents by title or opportunity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Document Listings */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center bg-slate-50 p-10 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <DocumentIcon className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Documents Found</h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {isFiltered
              ? `No documents matched ${selectedYear === 'ALL' ? 'All Years' : selectedYear} ${
                  selectedQuarter === 'ALL' ? 'Full Year' : selectedQuarter
                }${searchQuery ? ` with search term "${searchQuery}"` : ''}.`
              : 'Documents will appear here once you invest in an opportunity with uploaded documents.'}
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer mt-2"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Reset Filter to View All</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredDocuments.map((doc) => {
            const periodInfo = parseDocumentPeriod(doc);

            return (
              <div
                key={doc.id}
                className="flex items-start justify-between p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 gap-4"
              >
                <div className="flex gap-3.5 min-w-0">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0 h-fit">
                    <DocumentIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate" title={doc.name}>
                      {doc.name.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider truncate">
                      {doc.opportunities?.name || 'Investment Opportunity'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-400 font-medium">
                      <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                        {periodInfo.year} {periodInfo.quarter}
                      </span>
                      <span>•</span>
                      <span>
                        Added: {new Date(doc.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View Document */}
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-colors duration-200 flex items-center justify-center shadow-xs border border-slate-200/60"
                    title="View Document in New Tab"
                  >
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>

                  {/* Download Document */}
                  <a
                    href={doc.file_url}
                    download={doc.name || true}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-slate-100 hover:bg-blue-600 text-slate-600 hover:text-white rounded-xl transition-colors duration-200 flex items-center justify-center shadow-xs border border-slate-200/60"
                    title="Download Document"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
