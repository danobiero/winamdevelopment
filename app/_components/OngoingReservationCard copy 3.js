'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { FormatCurrency } from '@/app/_lib/utils';
import LessonCard from './LessonCard';

export default function OngoingReservationCard({ booking, calendarEvents }) {
  const { startDate, endDate, lessons, numNights, numStudents, status } =
    booking;
  const name = lessons?.name || 'Lesson';

  // Determine if booking is cancelled (if you have that prop)
  const isCancelled = booking.cancelled === true;

  return (
    <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-100 overflow-hidden w-full max-w-7xl mx-auto flex flex-col transition-all duration-300 hover:border-primary-200">
      {/* 1. TOP SECTION: Image and Title */}
      <div className="flex flex-col md:flex-row items-stretch bg-slate-50/50">
        <div className="relative h-48 sm:h-56 md:h-auto md:w-48 lg:w-64 flex-shrink-0 overflow-hidden">
          <Image src={lessons.image} fill alt={name} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent md:hidden" />
        </div>

        <div className="p-6 md:p-10 flex flex-col justify-center flex-grow min-w-0">
          <div className="min-w-0">
            {/* Responsive Font Scaling: 
               text-xl (mobile) -> text-2xl (tablet) -> text-4xl (desktop) 
            */}
            <h3
              className={`text-xl sm:text-2xl md:text-4xl font-black text-primary-950 tracking-tight leading-tight break-words mb-3
              ${isCancelled ? 'line-through text-gray-400 opacity-50' : ''}`}
            >
              {numNights
                ? `${numNights} Class${numNights > 1 ? 'es' : ''}`
                : 'Lesson'}{' '}
              in {name}
            </h3>

            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <p className="text-primary-600 font-bold text-sm md:text-base">
                {format(new Date(startDate), 'MMM dd')} —{' '}
                {format(new Date(endDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Calendar */}
      <div className="flex-grow bg-white px-2 md:px-6">
        <div className="rounded-3xl overflow-hidden">
          <LessonCard eventsByDate={calendarEvents} />
        </div>
      </div>

      {/* 3. BOTTOM SECTION: Summary Footer */}
      <div className="bg-slate-50/80 border-t border-slate-100 px-6 py-6 md:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
            <svg
              className="w-5 h-5 text-primary-500"
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
            <p className="text-primary-900 text-sm md:text-base font-black">
              {numStudents} Student{numStudents > 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <p className="text-[10px] text-primary-400 uppercase tracking-[0.2em] font-black mb-1">
              Status
            </p>
            <div className="bg-[#000033] px-6 py-2 rounded-xl shadow-lg shadow-blue-900/10">
              <p className="text-white text-lg md:text-xl font-black leading-none uppercase tracking-tighter">
                {status}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
