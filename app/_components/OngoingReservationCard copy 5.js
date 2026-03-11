'use client';

import { useState } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { FormatCurrency } from '@/app/_lib/utils';
import LessonCard from './LessonCard';
import LessonCalendar from './LessonCalendar';

export default function OngoingReservationCard({ booking, calendarEvents }) {
  const { startDate, endDate, lessons, numStudents, status } = booking;
  const name = lessons?.name || '';

  const [showFullCalendar, setShowFullCalendar] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-7xl mx-auto flex flex-col transition-all">
      {/* 1. TOP SECTION */}
      <div className="flex flex-col md:flex-row border-b border-slate-100 items-stretch">
        {/* Image */}
        <div className="relative h-44 sm:h-48 md:h-36 md:w-36 lg:w-44 flex-shrink-0 overflow-hidden">
          <Image
            src={lessons.image}
            fill
            alt={name}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 15vw"
          />
        </div>

        <div className="p-5 md:p-6 flex flex-col justify-center flex-grow min-w-0">
          <div className="min-w-0">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-snug">
              {name}
            </h3>

            <div className="flex items-center justify-between mt-1">
              <p className="text-slate-500 font-medium text-xs md:text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {format(new Date(startDate), 'MMM dd')} —{' '}
                {format(new Date(endDate), 'MMM dd, yyyy')}
              </p>

              {/* Desktop Full Calendar Toggle */}
              <button
                onClick={() => setShowFullCalendar(!showFullCalendar)}
                className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-600 transition font-semibold"
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
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION */}
      <div className="flex-grow">
        <LessonCard eventsByDate={calendarEvents} />
      </div>

      {/* 3. EXPANDED CALENDAR */}
      {showFullCalendar && (
        <div className="hidden md:block border-t border-slate-100 bg-white">
          <LessonCalendar eventsByDate={calendarEvents} />
        </div>
      )}

      {/* 4. FOOTER */}
      <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-slate-400"
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

            <p className="text-slate-600 text-xs md:text-sm font-semibold">
              {numStudents} Student{numStudents > 1 ? 's' : ''}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[9px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">
              Status
            </p>

            <p className="text-blue-900 text-sm md:text-base font-bold uppercase tracking-tight">
              {status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
