'use client';

import { useState } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isToday,
} from 'date-fns';

export default function LessonCalendar({ eventsByDate }) {
  const today = new Date();
  const todayKey = format(today, 'yyyy-MM-dd');

  // Always show current real month
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  function prevMonth() {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(startOfMonth(d));
  }

  function nextMonth() {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(startOfMonth(d));
  }

  function getEventsForDay(date) {
    const key = format(date, 'yyyy-MM-dd');
    return eventsByDate?.[key] || [];
  }

  const firstDayWeekday = monthDays[0].getDay();

  return (
    <div className="p-4 md:p-6 border-t border-primary-200 bg-white">
      {/* ===== MONTH HEADER ===== */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="px-3 py-1 rounded border bg-primary-100 hover:bg-primary-200"
        >
          ← Prev
        </button>

        <h4 className="text-xl font-semibold text-primary-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>

        <button
          onClick={nextMonth}
          className="px-3 py-1 rounded border bg-primary-100 hover:bg-primary-200"
        >
          Next →
        </button>
      </div>

      {/* ===== WEEKDAY HEADER ===== */}
      <div className="grid grid-cols-7 gap-2 text-center text-[9px] md:text-[10px] font-semibold text-primary-700 mb-2">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* ===== DAYS GRID ===== */}
      <div className="grid grid-cols-7 gap-2">
        {/* Padding before first day */}
        {Array.from({ length: firstDayWeekday }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {monthDays.map((day) => {
          const events = getEventsForDay(day);
          const dayKey = format(day, 'yyyy-MM-dd');
          const isPast = day < new Date(today.toDateString());
          const isTodayDate = dayKey === todayKey;
          const hasEvents = events.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={`
                border rounded-md p-1.5 min-h-[120px]
                flex flex-col items-center justify-between
                ${hasEvents ? 'bg-purple-50 border-purple-400' : 'bg-white'}
                ${isPast ? 'opacity-50' : ''}
                ${isTodayDate ? 'ring-2 ring-purple-600 bg-purple-100' : ''}
              `}
            >
              {/* Day Number */}
              <span className="font-semibold text-primary-900 text-[11px] md:text-[12px]">
                {format(day, 'd')}
              </span>

              {/* EVENTS LIST */}
              <div className="flex flex-col items-center gap-1 flex-grow mt-1 w-full px-0.5">
                {events.map((evt) => {
                  const eventDateKey = evt.start_time.split('T')[0];
                  const isEventToday = eventDateKey === todayKey;

                  return (
                    <div
                      key={evt.id}
                      className="flex flex-col items-center w-full"
                    >
                      {/* TIME (wrapped properly) */}
                      <span
                        className="
                          text-[8px] md:text-[9px] lg:text-[10px]
                          leading-tight text-primary-600
                          break-words whitespace-normal text-center
                        "
                      >
                        {format(new Date(evt.start_time), 'p')} –{' '}
                        {format(new Date(evt.end_time), 'p')}
                      </span>

                      {/* JOIN BUTTON LOGIC */}
                      {isEventToday ? (
                        <a
                          href={evt.meet_link}
                          target="_blank"
                          className="
                            text-[8px] md:text-[9px]
                            bg-purple-700 text-white px-2 py-0.5
                            rounded-full hover:bg-purple-800 mt-1
                          "
                        >
                          Join
                        </a>
                      ) : (
                        <span
                          className="
                            text-[8px] md:text-[9px]
                            bg-gray-300 text-gray-600 px-2 py-0.5
                            rounded-full mt-1 cursor-not-allowed
                          "
                        >
                          Not Today
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
