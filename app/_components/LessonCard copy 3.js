'use client';

import { useState } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from 'date-fns';
import { VideoCameraIcon } from '@heroicons/react/24/solid';

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
      {/* Header Navigation */}
      <div className="flex items-center justify-between p-4 border-b border-primary-100 bg-primary-50/30">
        <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wider">
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary-300">
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
                  className={`flex flex-col rounded-xl border border-primary-100 bg-white shadow-sm transition-all overflow-hidden ${isEnded ? 'opacity-70 grayscale-[0.4]' : 'hover:shadow-md'}`}
                >
                  <div className="p-4 flex-grow min-w-0">
                    <div className="mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${isEnded ? 'bg-zinc-700 text-zinc-200' : isTodayDate ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}`}
                      >
                        {isEnded ? 'Ended' : isTodayDate ? 'Today' : 'Upcoming'}
                      </span>
                    </div>
                    <h3
                      className={`text-sm font-bold text-blue-950 whitespace-nowrap overflow-hidden text-ellipsis ${isEnded ? 'line-through text-gray-400' : ''}`}
                    >
                      {format(evt.day, 'EEE, MMM dd')}
                    </h3>
                    <div className="mt-1">
                      <p className="text-lg font-black text-logo-100 tracking-tighter whitespace-nowrap">
                        {format(start, 'p')} – {format(end, 'p')}
                      </p>
                    </div>
                    <div className="mt-3 rounded-md bg-primary-50/40 border border-primary-50 p-2">
                      <span className="block text-[9px] font-mono uppercase opacity-50 tracking-tighter">
                        ID: {evt.id.toString().slice(-6)}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-primary-50 bg-primary-50/20 mt-auto">
                    {isTodayDate && !isEnded ? (
                      <a
                        href={evt.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 px-3 py-3 text-[10px] font-bold uppercase text-blue-600 hover:bg-white transition-all"
                      >
                        <VideoCameraIcon className="h-3 w-3" /> Join
                      </a>
                    ) : (
                      <div className="flex items-center justify-center px-3 py-3 text-[9px] font-bold uppercase text-primary-300 opacity-60">
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
