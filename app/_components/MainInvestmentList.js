'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BriefcaseIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  EnvelopeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';
import { FormatCurrency } from '../_lib/utils';

const TYPE_COLORS = {
  core: '#10b981',
  real_estate: '#f59e0b',
  stocks: '#3b82f6',
  default: '#64748b',
};

export default function MainInvestmentList({
  investments = [],
  latestValuations = {},
  onViewPerformance,
  onViewStatements,
  onSelectRedemption,
}) {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Sync index if investments array changes
  useEffect(() => {
    if (currentIndex >= investments.length) {
      setCurrentIndex(Math.max(0, investments.length - 1));
    }
  }, [investments.length, currentIndex]);

  // Recalculate scroll position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (scrollRef.current) {
        const width = scrollRef.current.clientWidth;
        scrollRef.current.scrollLeft = currentIndex * width;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentIndex]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
    const newIndex = Math.round(scrollLeft / clientWidth);
    if (newIndex >= 0 && newIndex < investments.length) {
      setCurrentIndex(newIndex);
    }
  };

  const scrollToIndex = (newIndex) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: newIndex * width,
      behavior: 'smooth',
    });
    setCurrentIndex(newIndex);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      scrollToIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < investments.length - 1) {
      scrollToIndex(currentIndex + 1);
    }
  };

  if (!investments.length) {
    return (
      <div className="lg:col-span-7 p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center h-full space-y-2">
        <BriefcaseIcon className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
        <p className="text-slate-700 dark:text-slate-300 font-bold text-sm sm:text-xs">
          No Active Positions Found
        </p>
        <p className="text-slate-400 dark:text-slate-500 text-xs max-w-xs mx-auto">
          Your portfolio is ready. Once you invest in an opportunity, its performance and official documents will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="lg:col-span-7 flex flex-col h-full min-h-0 min-w-0">
      {/* HEADER WITH TITLE AND PREV/NEXT CONTROLS */}
      <div className="flex items-center justify-between px-1 pb-2 mb-1 shrink-0">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-xs tracking-tight flex items-center gap-1.5">
          <BriefcaseIcon className="h-4.5 w-4.5 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
          Position Details
        </h3>
        <div className="flex items-center gap-2">
          {investments.length > 1 && (
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-1 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Previous position"
                aria-label="Previous position"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-mono font-bold px-1.5 select-none">
                {currentIndex + 1} of {investments.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === investments.length - 1}
                className="p-1 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Next position"
                aria-label="Next position"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:inline-block">
            {investments.length} Active {investments.length === 1 ? 'Asset' : 'Assets'}
          </span>
        </div>
      </div>

      {/* SINGLE CARD SCROLLER (LOADS IN THE SAME POSITION) */}
      <div className="relative flex-1 min-h-0 flex flex-col justify-between w-full">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {investments.map((inv) => {
            const name = inv.opportunities?.name || 'Investment Opportunity';
            const type = (inv.opportunities?.type || 'core').toLowerCase();
            const invested = Number(inv.amount_invested || 0);

            const current = latestValuations[inv.id]
              ? Number(latestValuations[inv.id])
              : invested;

            const profit = current - invested;
            const isActive = inv.status === 'active';

            return (
              <div
                key={inv.id}
                className="snap-center shrink-0 w-full min-w-full h-full flex flex-col"
              >
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-blue-300 dark:hover:border-blue-600 transition-all shadow-2xs flex-1 flex flex-col justify-between min-h-0">
                  {/* TOP HEADER */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              TYPE_COLORS[type] || TYPE_COLORS.default,
                          }}
                        />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                          {type.replace('_', ' ')} • ID #{inv.id}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        }`}
                      >
                        {inv.status || 'Active'}
                      </span>
                    </div>

                    <h4
                      className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight truncate mb-3"
                      title={name}
                    >
                      {name}
                    </h4>

                    {/* VALUATION & FINANCIAL METRICS */}
                    <div className="grid grid-cols-2 gap-3 p-3 sm:p-3.5 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="min-w-0">
                        <span className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block truncate">
                          Principal Invested
                        </span>
                        <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 truncate mt-0.5 font-mono">
                          {FormatCurrency(invested)}
                        </p>
                      </div>

                      <div className="min-w-0 text-right">
                        <span className="text-xs uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block truncate">
                          Current Valuation
                        </span>
                        <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate mt-0.5 font-mono">
                          {FormatCurrency(current)}
                        </p>
                        {invested > 0 && (
                          <p
                            className={`text-xs font-bold tracking-tight truncate mt-0.5 ${
                              profit >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {profit >= 0 ? '▲ +' : '▼ '}
                            {FormatCurrency(Math.abs(profit))} ({((profit / invested) * 100).toFixed(2)}%)
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => onViewPerformance(inv)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                    >
                      <ChartBarIcon className="h-4 w-4 shrink-0 text-slate-300" />
                      <span>Performance</span>
                    </button>

                    {onViewStatements && (
                      <button
                        type="button"
                        onClick={() => onViewStatements(inv)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <DocumentTextIcon className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                        <span>Statements</span>
                      </button>
                    )}

                    <Link
                      href="/account/documents"
                      className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs text-center"
                    >
                      <DocumentTextIcon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                      <span>Documents</span>
                    </Link>

                    {isActive ? (
                      <Link
                        href="/account/support"
                        className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs text-center"
                      >
                        <EnvelopeIcon className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                        <span>Support</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectRedemption(inv)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <ArrowPathIcon className="h-4 w-4 shrink-0" />
                        <span>Redeem</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FLOATING SIDE ARROWS */}
        {investments.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-800 dark:text-slate-200 w-8 h-8 flex items-center justify-center rounded-full shadow-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all z-10 active:scale-95 cursor-pointer"
                aria-label="Previous position"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
            )}

            {currentIndex < investments.length - 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-800 dark:text-slate-200 w-8 h-8 flex items-center justify-center rounded-full shadow-md border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all z-10 active:scale-95 cursor-pointer"
                aria-label="Next position"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            )}
          </>
        )}

        {/* DOT INDICATORS */}
        {investments.length > 1 && (
          <div className="flex justify-center items-center gap-1.5 pt-2 shrink-0">
            {investments.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === i
                    ? 'w-6 bg-blue-600 dark:bg-blue-500'
                    : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                }`}
                aria-label={`Go to position ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
