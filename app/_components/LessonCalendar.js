'use client';

import { useState } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns';

export default function LessonCalendar({ eventsByDate }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayWeekday = monthDays[0].getDay();

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

  return (
    <div className="p-2 md:p-6 border-t border-primary-200 bg-white">
      {/* ===== MONTH HEADER ===== */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h4 className="text-lg md:text-xl font-bold text-primary-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-primary-100 border border-primary-200"
          >
            <span className="sr-only">Previous</span>‹
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-primary-100 border border-primary-200"
          >
            <span className="sr-only">Next</span>›
          </button>
        </div>
      </div>

      {/* ===== WEEKDAY HEADER ===== */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 text-center text-[10px] md:text-xs font-bold text-primary-400 uppercase tracking-wider mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>
            {d[0]}
            <span className="hidden md:inline">{d.slice(1)}</span>
          </div>
        ))}
      </div>

      {/* ===== DAYS GRID ===== */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {Array.from({ length: firstDayWeekday }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square md:min-h-[100px]" />
        ))}

        {monthDays.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const events = eventsByDate?.[dayKey] || [];
          const isTodayDate = isSameDay(day, today);
          const hasEvents = events.length > 0;

          return (
            <div
              key={day.toISOString()}
              className={`
                relative flex flex-col items-center
                aspect-square md:aspect-auto md:min-h-[120px] 
                p-1 border rounded-lg transition-all
                ${hasEvents ? 'bg-purple-50 border-purple-200' : 'border-gray-50'}
                ${isTodayDate ? 'ring-2 ring-purple-600 bg-white shadow-md' : ''}
              `}
            >
              {/* Day Number */}
              <span
                className={`text-[10px] md:text-sm font-semibold ${hasEvents ? 'text-purple-700' : 'text-primary-900'}`}
              >
                {format(day, 'd')}
              </span>

              {/* Mobile View: Dots for events */}
              <div className="flex md:hidden mt-auto mb-1 gap-0.5">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="w-1.5 h-1.5 bg-purple-600 rounded-full"
                  />
                ))}
              </div>

              {/* Desktop View: Full Event Details */}
              <div className="hidden md:flex flex-col gap-1.5 w-full mt-2 overflow-y-auto max-h-[80px] scrollbar-hide">
                {events.map((evt) => (
                  <EventItem key={evt.id} evt={evt} isToday={isTodayDate} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile-Only Event List: Shows only when events exist for current month to save space */}
      <div className="mt-6 md:hidden">
        <h5 className="text-xs font-bold text-primary-400 uppercase mb-3">
          Schedule for {format(currentMonth, 'MMM')}
        </h5>
        <div className="space-y-3">
          {monthDays
            .filter((d) => eventsByDate?.[format(d, 'yyyy-MM-dd')]?.length > 0)
            .map((day) => (
              <div key={day.toString()} className="flex gap-4 items-start">
                <div className="text-center min-w-[40px]">
                  <p className="text-[10px] uppercase text-primary-400">
                    {format(day, 'EEE')}
                  </p>
                  <p className="text-lg font-bold text-primary-900">
                    {format(day, 'd')}
                  </p>
                </div>
                <div className="flex-grow space-y-2">
                  {eventsByDate[format(day, 'yyyy-MM-dd')].map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 bg-primary-50 rounded-xl flex justify-between items-center"
                    >
                      <div>
                        <p className="text-xs font-bold text-primary-900">
                          {format(new Date(evt.start_time), 'p')} -{' '}
                          {format(new Date(evt.end_time), 'p')}
                        </p>
                      </div>
                      {isSameDay(day, today) && (
                        <a
                          href={evt.meet_link}
                          target="_blank"
                          className="bg-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function EventItem({ evt, isToday }) {
  return (
    <div className="flex flex-col items-center w-full px-1">
      <span className="text-[9px] leading-tight text-primary-600 text-center">
        {format(new Date(evt.start_time), 'p')}
      </span>
      {isToday ? (
        <a
          href={evt.meet_link}
          target="_blank"
          className="text-[9px] bg-purple-700 text-white px-2 py-0.5 rounded-md mt-1 w-full text-center"
        >
          Join
        </a>
      ) : (
        <span className="text-[9px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-md mt-1 w-full text-center">
          Upcoming
        </span>
      )}
    </div>
  );
}
