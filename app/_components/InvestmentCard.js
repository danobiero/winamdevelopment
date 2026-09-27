'use client';

import React from 'react';
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/solid';
import { format, parseISO, formatDistance } from 'date-fns';
import Link from 'next/link';
import { FormatCurrency } from '../_lib/utils';

/**
 * Helper to format the time elapsed since creation
 */
export const formatDistanceFromNow = (dateStr) =>
  dateStr
    ? formatDistance(parseISO(dateStr), new Date(), {
        addSuffix: true,
      }).replace('about ', '')
    : 'N/A';

function InvestmentCard({ investment }) {
  const {
    id,
    amount_invested,
    total_committed,
    status,
    start_date,
    created_at,
  } = investment;

  // Financial calculations
  const deployed = amount_invested || 0;
  const committed = total_committed || 0;
  const deploymentRatio =
    committed > 0 ? Math.round((deployed / committed) * 100) : 0;

  // Secondary status label
  const capitalState =
    status === 'active'
      ? deploymentRatio === 100
        ? 'Fully Deployed'
        : 'Deploying'
      : status === 'exited'
        ? 'Exited'
        : 'Pending';

  return (
    <div className="w-full flex flex-col bg-transparent min-w-0">
      {/* 1. FINANCIAL VALUES GRID */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
        <div className="bg-slate-50/70 dark:bg-slate-900/50 p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs min-w-0 overflow-hidden">
          <p className="text-[9px] sm:text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold mb-0.5 tracking-tight truncate">
            Deployed
          </p>
          <p className="text-sm sm:text-base lg:text-lg font-black text-blue-900 dark:text-blue-400 leading-tight tracking-tight truncate">
            {FormatCurrency(deployed)}
          </p>
        </div>

        <div className="bg-slate-50/70 dark:bg-slate-900/50 p-2 sm:p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-2xs min-w-0 overflow-hidden">
          <p className="text-[9px] sm:text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold mb-0.5 tracking-tight truncate">
            Committed
          </p>
          <p className="text-sm sm:text-base lg:text-lg font-black text-slate-800 dark:text-slate-200 leading-tight tracking-tight truncate">
            {FormatCurrency(committed)}
          </p>
        </div>
      </div>

      {/* 2. PROGRESS SECTION */}
      {committed > 0 && (
        <div className="mt-2.5 sm:mt-3 min-w-0">
          <div className="flex justify-between text-[10px] mb-1 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
            <span>Deployment Progress</span>
            <span className="text-blue-600 dark:text-blue-400 font-black">{deploymentRatio}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(deploymentRatio, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. METADATA FOOTER */}
      <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
          <div className="flex items-center gap-1.5 truncate">
            <CalendarIcon className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">
              Opened:{' '}
              {start_date
                ? format(parseISO(start_date), 'MMM dd, yyyy')
                : 'N/A'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <ArrowTrendingUpIcon className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">
              Status:{' '}
              <span className="text-blue-700 dark:text-blue-400 font-black">{capitalState}</span>
            </span>
          </div>

          {/* Calendar/Events Quick Link */}
          <Link
            href="/account/calendar"
            className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition group bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/60 shrink-0"
          >
            <CalendarDaysIcon className="h-3 w-3 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-tight">
              Events
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default InvestmentCard;
