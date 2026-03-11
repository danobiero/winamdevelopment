'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { FormatCurrency } from '@/app/_lib/utils';
import LessonCard from './LessonCard';

export default function OngoingReservationCard({ booking, calendarEvents }) {
  const { startDate, endDate, lessons, numNights, numStudents, status } =
    booking;
  const name = lessons?.name || '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden w-full max-w-7xl mx-auto flex flex-col transition-all">
      {/* 1. TOP SECTION: Balanced Split */}
      <div className="flex flex-col md:flex-row border-b border-slate-100 items-stretch">
        {/* Image: Fixed square-ish size on desktop to keep title clean */}
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
            {/* Font size reduced to text-lg/text-xl to match your image */}
            <h3 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-snug">
             
               {name}
            </h3>

            <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {format(new Date(startDate), 'MMM dd')} —{' '}
              {format(new Date(endDate), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Schedule */}
      <div className="flex-grow">
        <LessonCard eventsByDate={calendarEvents} />
      </div>

      {/* 3. BOTTOM SECTION: Clean Footer */}
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
