'use client';

import { useState } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameDay,
  isPast,
} from 'date-fns';
import {
  VideoCameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function InvestmentCalendar({ eventsByDate }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDayWeekday = monthDays[0].getDay();

  const nextMonth = () =>
    setCurrentMonth(
      startOfMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      )
    );
  const prevMonth = () =>
    setCurrentMonth(
      startOfMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      )
    );

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-xl overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between p-6 bg-slate-900 text-white">
        <div>
          <h4 className="text-2xl font-black tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h4>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
            Shareholder Briefing Schedule
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ===== CALENDAR GRID ===== */}
      <div className="p-1 md:p-4">
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-inner">
          {Array.from({ length: firstDayWeekday }).map((_, i) => (
            <div
              key={`pad-${i}`}
              className="bg-slate-50/50 aspect-square md:min-h-[130px]"
            />
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
                  relative flex flex-col bg-white p-2
                  aspect-square md:aspect-auto md:min-h-[150px] transition-all
                  ${isTodayDate ? 'ring-2 ring-inset ring-primary-600 z-10 bg-primary-50/30' : ''}
                  ${hasEvents ? 'bg-slate-50/30' : ''}
                `}
              >
                <span
                  className={`text-xs font-black ${isTodayDate ? 'text-primary-600' : 'text-slate-400'}`}
                >
                  {format(day, 'd')}
                </span>

                {/* Event Stack */}
                <div className="hidden md:flex flex-col gap-2 mt-2 overflow-y-auto max-h-[110px] scrollbar-hide">
                  {events.map((evt) => (
                    <InvestmentEvent
                      key={evt.id}
                      evt={evt}
                      isToday={isTodayDate}
                    />
                  ))}
                </div>

                {/* Mobile indicators */}
                <div className="md:hidden mt-auto flex justify-center gap-1">
                  {events.map((e) => (
                    <div
                      key={e.id}
                      className="w-1.5 h-1.5 rounded-full bg-primary-600"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function InvestmentEvent({ evt, isToday }) {
  const isEnded = new Date(evt.end_time) < new Date();

  return (
    <div
      className={`
      p-2 rounded-lg border text-[10px] leading-tight transition-all
      ${isEnded ? 'bg-slate-100 border-slate-200 opacity-50' : 'bg-white border-slate-200 shadow-sm hover:border-primary-300'}
    `}
    >
      <div className="flex items-center gap-1 mb-1">
        {evt.type === 'governance' ? (
          <ShieldCheckIcon className="h-3 w-3 text-amber-600" />
        ) : (
          <ChartBarIcon className="h-3 w-3 text-primary-600" />
        )}
        <span className="font-black text-slate-900 truncate uppercase">
          {evt.title || 'Briefing'}
        </span>
      </div>

      <p className="text-slate-500 font-medium mb-2">
        {format(new Date(evt.start_time), 'p')}
      </p>

      {!isEnded && isToday && (
        <a
          href={evt.meet_link}
          target="_blank"
          className="flex items-center justify-center gap-1 w-full bg-slate-900 text-white py-1.5 rounded-md font-bold hover:bg-primary-600 transition-all text-[9px] uppercase tracking-wider"
        >
          <VideoCameraIcon className="h-3 w-3" />
          Join Room
        </a>
      )}
    </div>
  );
}
