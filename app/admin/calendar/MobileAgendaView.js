'use client';

import {
  format,
  isSameDay,
  startOfWeek,
  addDays,
  eachDayOfInterval,
} from 'date-fns';
import { useMemo, useState } from 'react';

export default function MobileAgendaView({
  events,
  lessonColorMap = {},
  onEventClick,
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateRibbon = useMemo(() => {
    const start = startOfWeek(new Date());
    return eachDayOfInterval({ start, end: addDays(start, 13) });
  }, []);

  const dailyEvents = useMemo(() => {
    return events
      .filter((ev) => isSameDay(new Date(ev.start_time), selectedDate))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  }, [events, selectedDate]);

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="flex overflow-x-auto no-scrollbar gap-2 p-4 border-b border-slate-100 bg-slate-50/30">
        {dateRibbon.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const hasEvents = events.some((ev) =>
            isSameDay(new Date(ev.start_time), date)
          );

          return (
            <button
              key={date.toString()}
              onClick={() => setSelectedDate(date)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-xl transition-all ${
                isSelected
                  ? 'bg-[#000033] text-white shadow-lg scale-105'
                  : 'bg-white text-slate-500 border border-slate-100'
              }`}
            >
              <span className="text-xs uppercase font-bold opacity-70">
                {format(date, 'EEE')}
              </span>
              <span className="text-sm font-black mt-1">
                {format(date, 'd')}
              </span>
              {hasEvents && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-blue-500 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 space-y-3">
        {dailyEvents.length > 0 ? (
          dailyEvents.map((ev) => {
            const color = lessonColorMap[ev.lesson_id] || {
              bg: 'bg-slate-50',
              text: 'text-slate-600',
            };
            return (
              <button
                key={ev.id}
                onClick={() => onEventClick(ev)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white shadow-sm border border-slate-100 text-left active:scale-[0.98] transition-transform"
                style={{
                  borderLeft: `4px solid var(--tw-${color.text.split('-')[1]}-500)`,
                }}
              >
                <div className="flex flex-col border-r border-slate-100 pr-4 min-w-[65px]">
                  <span className="text-xs font-black text-[#000033]">
                    {format(new Date(ev.start_time), 'h:mm')}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {format(new Date(ev.start_time), 'a')}
                  </span>
                </div>
                <div className="flex-1 truncate">
                  <h5 className="text-sm font-black text-slate-800 truncate">
                    {ev.title}
                  </h5>
                  <p className="text-xs text-slate-500 font-medium">
                    {ev.bookingDetails?.length > 0
                      ? `${ev.bookingDetails.length} Student(s)`
                      : 'Unbooked'}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="py-20 text-center text-slate-400 text-xs font-bold uppercase">
            No sessions today
          </div>
        )}
      </div>
    </div>
  );
}
