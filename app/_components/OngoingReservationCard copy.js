'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import LessonCalendar from './LessonCalendar';

export default function OngoingReservationCard({ booking, calendarEvents }) {
  const { startDate, endDate, lessons, totalPrice, numStudents } = booking;

  const category = lessons?.category;
  const name = lessons?.name;

  return (
    <div
      className="
      bg-white border border-primary-800 rounded-lg shadow-sm 
      overflow-hidden w-full max-w-7xl mx-auto
    "
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start">
        <div className="relative h-40 w-full md:h-32 md:w-32 flex-shrink-0">
          <Image
            src={lessons.image}
            fill
            alt={name}
            className="object-cover border-b md:border-r border-primary-800"
          />
        </div>

        <div className="p-4 md:p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-semibold text-primary-900">{name}</h3>

          <p className="text-primary-600 mt-1">
            {format(new Date(startDate), 'EEE, MMM dd')} →{' '}
            {format(new Date(endDate), 'EEE, MMM dd')}
          </p>

          <p className="text-accent-500 text-lg mt-2 font-semibold">
            ${totalPrice}
          </p>

          <p className="text-primary-500 text-sm">
            {numStudents} Student{numStudents > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ⭐ NEW: Use REAL event data instead of outdated logic */}
      <LessonCalendar eventsByDate={calendarEvents} />
    </div>
  );
}
