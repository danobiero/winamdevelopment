'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { FormatCurrency } from '@/app/_lib/utils';
import LessonCalendar from './LessonCalendar';

export default function OngoingReservationCard({ booking, calendarEvents }) {
  const { startDate, endDate, lessons, totalPrice, numStudents, status } = booking;
  const name = lessons?.name;

  return (
    <div className="bg-white border border-primary-800 rounded-lg shadow-sm overflow-hidden w-full max-w-7xl mx-auto flex flex-col">
      {/* 1. TOP SECTION: Image and Title */}
      <div className="flex flex-col md:flex-row border-b border-primary-100">
        <div className="relative h-40 sm:h-48 md:h-32 md:w-32 flex-shrink-0">
          <Image src={lessons.image} fill alt={name} className="object-cover" />
        </div>

        <div className="p-4 md:p-6 flex flex-col justify-center">
          <h3 className="text-lg md:text-xl font-bold text-primary-900 leading-tight">
            {name}
          </h3>
          <p className="text-primary-500 font-medium text-sm mt-1">
            {format(new Date(startDate), 'MMM dd')} —{' '}
            {format(new Date(endDate), 'MMM dd, yyyy')}
          </p>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Calendar */}
      <div className="flex-grow">
        <LessonCalendar eventsByDate={calendarEvents} />
      </div>

      {/* 3. BOTTOM SECTION: Summary Footer */}
      <div className="bg-primary-50/50 border-t border-primary-200 px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Optional icon for students */}
            <svg
              className="w-4 h-4 text-primary-400"
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
            <p className="text-primary-600 text-sm font-medium">
              {numStudents} Student{numStudents > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-400 uppercase tracking-wider font-semibold border-b border-primary-400/30 pb-1 mb-1">
              Status
            </p>
            <p className="text-logo-100 text-lg md:text-xl font-bold leading-none uppercase">
              {status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
