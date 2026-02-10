'use client';

import { useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  format,
  isSameMonth,
  isToday,
} from 'date-fns';
import BookingModal from './BookingModal';

/* ============================================================
   LESSON TIME WINDOWS (CST) — UI USES SAME RULE AS BACKEND
   ============================================================ */
const LESSON_WINDOWS = {
  1: { start: '12:00', end: '14:00' }, // Lesson Category 1
  2: { start: '16:30', end: '18:30' }, // Lesson Category 2
};

function toCSTTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLessonCategoryFromEvent(startTime, endTime) {
  const start = toCSTTime(startTime);
  const end = toCSTTime(endTime);

  for (const [lessonId, window] of Object.entries(LESSON_WINDOWS)) {
    if (start === window.start && end === window.end) {
      return Number(lessonId);
    }
  }
  return null;
}

export default function CalendarGrid({ events }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  /* SAFETY CHECKS */
  if (!Array.isArray(events)) {
    return (
      <div className="text-red-600 font-semibold">
        CalendarGrid Error: Invalid event data.
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-gray-500 italic">No calendar events available.</div>
    );
  }

  /* MONTH BOUNDARIES */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  /* BUILD DAY GRID */
  const days = [];
  let day = weekStart;
  while (day <= weekEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  /* MAP EVENTS BY DATE */
  const eventMap = {};
  events.forEach((ev) => {
    const key = format(new Date(ev.start_time), 'yyyy-MM-dd');
    if (!eventMap[key]) eventMap[key] = [];
    eventMap[key].push(ev);
  });

  /* EVENT COLOR PALETTE (BY TIME SLOT ONLY) */
  const lessonColors = {
    1: {
      bg: 'bg-blue-100',
      border: 'border-blue-300',
      text: 'text-blue-900',
      hover: 'hover:bg-blue-200',
    },
    2: {
      bg: 'bg-purple-100',
      border: 'border-purple-300',
      text: 'text-purple-900',
      hover: 'hover:bg-purple-200',
    },
    default: {
      bg: 'bg-gray-100',
      border: 'border-gray-300',
      text: 'text-gray-800',
      hover: 'hover:bg-gray-200',
    },
  };

  return (
    <div>
      {/* MONTH HEADER */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Prev
        </button>

        <h3 className="text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Next →
        </button>
      </div>

      {/* CALENDAR GRID */}
      <div className="grid grid-cols-7 gap-2 border rounded-lg p-4 bg-white shadow">
        {/* WEEKDAY HEADERS */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
          <div key={label} className="text-center font-semibold mb-2">
            {label}
          </div>
        ))}

        {/* DAY CELLS */}
        {days.map((dayItem, idx) => {
          const dateKey = format(dayItem, 'yyyy-MM-dd');
          const thisDaysEvents = eventMap[dateKey] ?? [];

          return (
            <div
              key={idx}
              className={`border p-2 rounded min-h-[120px] flex flex-col gap-1
                ${
                  isSameMonth(dayItem, currentMonth)
                    ? 'bg-white'
                    : 'bg-gray-100 text-gray-400'
                }
                ${
                  isToday(dayItem)
                    ? 'bg-yellow-100 border-yellow-400 shadow-md'
                    : ''
                }
              `}
            >
              {/* DAY NUMBER */}
              <div className="font-semibold">{format(dayItem, 'd')}</div>

              {/* BOOKINGS — RENDERED AS PROVIDED BY BACKEND */}
              {thisDaysEvents.map((ev) => {
                // 🔒 COLOR IS DERIVED ONCE PER EVENT
                const lessonId = getLessonCategoryFromEvent(
                  ev.start_time,
                  ev.end_time
                );

                const color = lessonColors[lessonId] || lessonColors.default;

                return ev.bookingDetails?.map((booking) => (
                  <button
                    key={`${ev.id}-${booking.id}`} // 🔒 prevents duplicates
                    onClick={() => {
                      setSelectedBooking(booking);
                      setSelectedEvent(ev);
                    }}
                    className={`text-xs px-2 py-1 rounded w-full truncate text-left
                      ${color.bg} ${color.text} ${color.border} ${color.hover}
                      transition`}
                  >
                    #{booking.id}
                  </button>
                ));
              })}
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      <BookingModal
        booking={selectedBooking}
        event={selectedEvent}
        onClose={() => setSelectedBooking(null)}
      />
    </div>
  );
}
