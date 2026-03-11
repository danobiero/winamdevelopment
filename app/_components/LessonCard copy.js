'use client';

import { useState } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns';

export default function LessonCard({ eventsByDate }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(startOfMonth(d));
  };

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(startOfMonth(d));
  };

  // Convert eventsByDate to a flat list
  const eventList = monthDays.flatMap((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const events = eventsByDate?.[key] || [];

    return events.map((evt) => ({
      ...evt,
      day,
    }));
  });

  return (
    <div className="p-2 md:p-6 border-t border-primary-200 bg-white">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-6 px-2">
        <h4 className="text-lg md:text-xl font-bold text-primary-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>

        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-primary-100 border border-primary-200"
          >
            ‹
          </button>

          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-primary-100 border border-primary-200"
          >
            ›
          </button>
        </div>
      </div>

      {/* ===== CARD GRID ===== */}
      {eventList.length === 0 ? (
        <div className="text-center text-primary-400 italic py-12">
          No scheduled lessons for this month
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {eventList.map((evt) => {
            const start = new Date(evt.start_time);
            const end = new Date(evt.end_time);
            const isEnded = end < new Date();
            const isTodayDate = isSameDay(evt.day, today);

            return (
              <div
                key={evt.id}
                className="p-5 bg-white border border-primary-200 rounded-2xl shadow-sm hover:shadow-md transition"
              >
                {/* Date */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs uppercase text-primary-400">
                      {format(evt.day, 'EEEE')}
                    </p>
                    <p className="text-lg font-bold text-primary-900">
                      {format(evt.day, 'MMM d')}
                    </p>
                  </div>

                  {isTodayDate && (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
                      Today
                    </span>
                  )}
                </div>

                {/* Time */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-primary-900">
                    {format(start, 'p')} – {format(end, 'p')}
                  </p>
                </div>

                {/* Status / Action */}
                <div className="flex justify-end">
                  {isEnded ? (
                    <span className="bg-gray-300 text-gray-600 px-4 py-1.5 rounded-full text-xs font-bold">
                      Ended
                    </span>
                  ) : isTodayDate ? (
                    <a
                      href={evt.meet_link}
                      target="_blank"
                      className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-purple-700"
                    >
                      Join Lesson
                    </a>
                  ) : (
                    <span className="bg-gray-200 text-gray-500 px-4 py-1.5 rounded-full text-xs font-bold">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
