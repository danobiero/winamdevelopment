'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { FormatCurrency } from '@/app/_lib/utils';
import LessonCard from './LessonCard';
import LessonCalendar from './InvestmentCalendar';

export default function OngoingReservationCard({ booking, calendarEvents }) {
  const { startDate, endDate, lessons, numStudents, status } = booking;
  const name = lessons?.name || '';

  const [showFullCalendar, setShowFullCalendar] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-7xl mx-auto flex flex-col transition-all">
      {/* 1. TOP SECTION: Fixed warping and wrapping */}
      <div className="flex flex-col md:flex-row border-b border-slate-100 items-stretch min-h-fit">
        {/* Image: Fixed height issues with aspect-square or stable md width */}
        <div className="relative h-48 md:h-auto md:w-40 lg:w-48 flex-shrink-0 overflow-hidden bg-slate-100">
          <Image
            src={lessons.image}
            fill
            alt={name}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 20vw"
          />
        </div>

        <div className="p-5 md:p-6 flex flex-col justify-center flex-grow min-w-0">
          <div className="min-w-0">
            {/* Responsive Text Sizes */}
            <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-slate-800 tracking-tight leading-tight truncate md:whitespace-normal">
              {name}
            </h3>

            <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
              <p className="text-slate-500 font-medium text-xs md:text-sm flex items-center gap-2 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                {format(new Date(startDate), 'MMM dd')} —{' '}
                {format(new Date(endDate), 'MMM dd, yyyy')}
              </p>

              {/* Desktop Full Calendar Toggle */}
              <button
                onClick={() => setShowFullCalendar(!showFullCalendar)}
                className="hidden md:flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition font-bold uppercase tracking-wider"
              >
                {showFullCalendar ? 'Hide Calendar' : 'Full Calendar'}

                <svg
                  className={`w-4 h-4 transition-transform ${
                    showFullCalendar ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Content area that expands without warping top image */}
      <div className="flex-grow overflow-hidden">
        <LessonCard eventsByDate={calendarEvents} />
      </div>

      {/* 3. EXPANDED CALENDAR */}
      {showFullCalendar && (
        <div className="hidden md:block border-t border-slate-100 bg-slate-50/30 p-4">
          {/* Calendar Month Container with rounded corners */}
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
            <LessonCalendar eventsByDate={calendarEvents} />
          </div>
        </div>
      )}

      {/* 4. FOOTER */}
      <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-4 mt-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <svg
              className="w-4 h-4 text-slate-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>

            <p className="text-slate-600 text-xs md:text-sm font-semibold truncate">
              {numStudents} Student{numStudents > 1 ? 's' : ''}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-0.5">
              Status
            </p>

            <p className="text-blue-900 text-xs md:text-sm font-black uppercase tracking-tight">
              {status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
