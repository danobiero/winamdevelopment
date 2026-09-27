'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';

export default function FilterPanel({
  basePath,
  opportunities = null, // Set to null to hide opportunity dropdown
  showDateRange = false,
  searchLabel = 'Search Shareholder',
  searchParamName = 'searchShareholder',
  placeholder = 'Type shareholder name...',
  initialSearchValue = '',
  initialFilterOpportunity = '',
  initialStartDate = '',
  initialEndDate = '',
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchValue, setSearchValue] = useState(initialSearchValue);
  const [filterOpportunity, setFilterOpportunity] = useState(initialFilterOpportunity);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Sync state if initial props change (e.g., on clear/reset)
  useEffect(() => {
    setSearchValue(initialSearchValue);
    setFilterOpportunity(initialFilterOpportunity);
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  }, [initialSearchValue, initialFilterOpportunity, initialStartDate, initialEndDate]);

  // Function to build query string and push transition
  const applyFilters = (updatedValues = {}) => {
    const currentValues = {
      searchValue,
      filterOpportunity,
      startDate,
      endDate,
      ...updatedValues,
    };

    const params = new URLSearchParams();
    
    // Maintain current pagination/view params if any
    const page = searchParams.get('page');
    if (page) params.set('page', page);

    if (currentValues.searchValue?.trim()) {
      params.set(searchParamName, currentValues.searchValue.trim());
    }
    if (opportunities && currentValues.filterOpportunity) {
      params.set('filterOpportunity', currentValues.filterOpportunity);
    }
    if (showDateRange) {
      if (currentValues.startDate) params.set('startDate', currentValues.startDate);
      if (currentValues.endDate) params.set('endDate', currentValues.endDate);
    }

    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`, { scroll: false });
    });
  };

  // Debounce search input to avoid hitting database on every keystroke
  useEffect(() => {
    if (searchValue === initialSearchValue) return;
    
    const handler = setTimeout(() => {
      applyFilters({ searchValue });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchValue]);

  // Handle immediate filters
  const handleOpportunityChange = (e) => {
    const val = e.target.value;
    setFilterOpportunity(val);
    applyFilters({ filterOpportunity: val });
  };

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    applyFilters({ startDate: val });
  };

  const handleEndDateChange = (e) => {
    const val = e.target.value;
    setEndDate(val);
    applyFilters({ endDate: val });
  };

  const hasActiveFilters = 
    initialSearchValue || 
    (opportunities && initialFilterOpportunity) || 
    (showDateRange && (initialStartDate || initialEndDate));

  return (
    <div className="relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Animated Top Loading Bar */}
      <div 
        className={`absolute top-0 left-0 right-0 h-1 bg-blue-600 transition-transform duration-500 ease-out origin-left ${
          isPending ? 'scale-x-100 animate-pulse' : 'scale-x-0'
        }`}
      />

      <div className={`p-4 flex flex-wrap gap-4 items-end transition-opacity duration-200 ${isPending ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
        {/* Generic Search Input */}
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="genericSearchInput" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
            {searchLabel}
          </label>
          <div className="relative">
            <input
              type="text"
              id="genericSearchInput"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={placeholder}
              className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50 pr-8"
            />
            {isPending && (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Opportunity Filter (Conditional) */}
        {opportunities && (
          <div className="w-full sm:w-56">
            <label htmlFor="filterOpportunity" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
              Filter by Opportunity
            </label>
            <select
              id="filterOpportunity"
              value={filterOpportunity}
              onChange={handleOpportunityChange}
              className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
            >
              <option value="">All Opportunities</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Ranges (Conditional) */}
        {showDateRange && (
          <>
            <div className="w-full sm:w-40">
              <label htmlFor="startDate" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="w-full sm:w-40">
              <label htmlFor="endDate" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full text-xs font-semibold border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>
          </>
        )}

        {/* Action Controls */}
        <div className="flex gap-2">
          {hasActiveFilters && (
            <Link
              href={basePath}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-lg transition-all text-center flex items-center justify-center border font-sans"
            >
              Clear
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
