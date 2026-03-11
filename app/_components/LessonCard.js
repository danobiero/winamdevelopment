'use client';

import { useState } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns';
import {
  VideoCameraIcon,
  CheckCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/solid';

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

  const eventList = monthDays.flatMap((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const events = eventsByDate?.[key] || [];
    return events.map((evt) => ({ ...evt, day }));
  });

  return (
    <div className="flex flex-col bg-white">
      {/* Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b border-primary-100 bg-primary-50">
        <h4 className="text-sm font-black text-blue-950 uppercase tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 transition-all active:scale-95"
          >
            ‹
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-primary-200 text-primary-600 hover:bg-primary-50 transition-all active:scale-95"
          >
            ›
          </button>
        </div>
      </div>

      <div className="p-4">
        {eventList.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-primary-50 rounded-xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-300">
              No lessons scheduled
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eventList.map((evt) => {
              const start = new Date(evt.start_time);
              const end = new Date(evt.end_time);
              const isEnded = end < today;
              const isTodayDate = isSameDay(evt.day, today);

              return (
                <div
                  key={evt.id}
                  className={`flex flex-col rounded-xl border transition-all duration-200 overflow-hidden relative
                    ${isEnded ? 'opacity-70 grayscale-[0.4] border-primary-100 bg-slate-50' : 'bg-white'}
                    ${
                      isTodayDate
                        ? 'bg-amber-50 border-green-300 z-10'
                        : 'border-primary-100 hover:border-primary-300'
                    }`}
                >
                  <div className="p-4 flex-grow min-w-0">
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          isEnded
                            ? 'bg-zinc-700 text-zinc-200'
                            : isTodayDate
                              ? 'bg-green-500 text-white'
                              : 'bg-orange-500 text-white'
                        }`}
                      >
                        {isEnded ? 'Ended' : isTodayDate ? 'Today' : 'Upcoming'}
                      </span>
                      {isTodayDate && !isEnded && (
                        <CalendarIcon className="h-3 w-3 text-green-500" />
                      )}
                    </div>

                    <h3
                      className={`text-sm font-black text-blue-950 whitespace-nowrap overflow-hidden text-ellipsis ${isEnded ? 'line-through text-gray-400' : ''}`}
                    >
                      {format(evt.day, 'EEE, MMM dd')}
                    </h3>

                    <div className="mt-1">
                      <p
                        className={`text-lg font-black tracking-tighter whitespace-nowrap ${isTodayDate ? 'text-blue-900' : 'text-logo-100'}`}
                      >
                        {format(start, 'p')} – {format(end, 'p')}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div
                    className={`border-t mt-auto ${isTodayDate ? 'border-green-200' : 'border-primary-50'}`}
                  >
                    {isTodayDate && !isEnded ? (
                      <a
                        href={evt.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-3 py-4 text-[10px] font-black uppercase bg-green-500 text-white hover:bg-blue-600 transition-all active:scale-95"
                      >
                        <VideoCameraIcon className="h-3.5 w-3.5" />
                        Join Session
                      </a>
                    ) : (
                      <div
                        className={`flex items-center justify-center gap-1.5 px-3 py-4 text-[10px] font-black uppercase tracking-widest ${
                          isEnded
                            ? 'bg-zinc-100 text-zinc-500'
                            : 'bg-orange-50/30 text-orange-600'
                        }`}
                      >
                        {isEnded && <CheckCircleIcon className="h-3.5 w-3.5" />}
                        {isEnded ? 'Finished' : 'Upcoming'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
