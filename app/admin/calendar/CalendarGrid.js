'use client';

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import BookingModal from './BookingModal';
import { getAdminBookingsForDate } from './actions';

/* ============================================================
    COLOR PALETTE (PER LESSON_ID)
   ============================================================ */
const COLOR_POOL = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
];

const FALLBACK_COLOR = {
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  text: 'text-slate-600',
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CalendarGrid({ events, onError, onAddAvailability }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [bookingsForDate, setBookingsForDate] = useState([]);
  const [isLoadingDate, setIsLoadingDate] = useState(false);
  const [dateError, setDateError] = useState(null);

  if (!Array.isArray(events)) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">
          Data Error: Invalid Event Stream
        </p>
      </div>
    );
  }

  /* ===================== MONTH GRID CALCS ===================== */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  /* ===================== EVENT MAPPING ===================== */
  const eventMap = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = format(new Date(ev.start_time), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const lessonColorMap = useMemo(() => {
    const map = {};
    const ids = Array.from(
      new Set(events.map((e) => e.lesson_id).filter(Boolean))
    ).sort((a, b) => Number(a) - Number(b));

    ids.forEach((id, i) => {
      map[id] = COLOR_POOL[i % COLOR_POOL.length];
    });
    return map;
  }, [events]);

  /* ===================== HANDLERS ===================== */
  const handleDateClick = (dateKey) => {
    setSelectedEvent(null);
    setSelectedDate(dateKey);
    setBookingsForDate([]);
    setDateError(null);
  };

  const handleEventClick = (e, ev) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDate(null);
    setSelectedEvent(ev);
  };

  useEffect(() => {
    if (!selectedDate) return;
    let active = true;
    const loadBookings = async () => {
      try {
        setIsLoadingDate(true);
        const sessions = await getAdminBookingsForDate(selectedDate);
        if (active) setBookingsForDate(sessions || []);
      } catch (err) {
        if (active) setDateError('Failed to sync date bookings.');
      } finally {
        if (active) setIsLoadingDate(false);
      }
    };
    loadBookings();
    return () => {
      active = false;
    };
  }, [selectedDate]);

  return (
    <div className="w-full">
      {/* --- GRID HEADER --- */}
      <div className="flex justify-between items-center px-6 py-4 bg-slate-50/50 border-b border-slate-100">
        <h3 className="text-[13px] font-black text-[#000033] uppercase tracking-[0.15em]">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
            className="p-1.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-md transition-all text-slate-400 hover:text-slate-900"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors"
          >
            Today
          </button>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-md transition-all text-slate-400 hover:text-slate-900"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* --- CALENDAR GRID --- */}
      <div className="grid grid-cols-7 overflow-hidden rounded-b-2xl">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div
            key={d}
            className="py-2.5 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-r border-slate-100 last:border-r-0 bg-white"
          >
            {d}
          </div>
        ))}

        {days.map((dayItem, idx) => {
          const dateKey = format(dayItem, 'yyyy-MM-dd');
          const dayEvents = eventMap[dateKey] || [];
          const isCurrentMonth = isSameMonth(dayItem, currentMonth);
          const isTodayDate = isToday(dayItem);

          return (
            <div
              key={idx}
              onClick={(e) => {
                if (e.target.closest('button')) return;
                handleDateClick(dateKey);
              }}
              className={`
                relative min-h-[130px] p-2 border-b border-r border-slate-100 last:border-r-0 cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/30 text-slate-300'}
                ${isTodayDate ? 'bg-amber-50/70 border-l-4 border-l-amber-400 z-10' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`
                  text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm
                  ${isTodayDate ? 'bg-[#000033] text-white' : 'text-slate-400'}
                `}
                >
                  {format(dayItem, 'd')}
                </span>

                {isTodayDate && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[7px] font-black uppercase tracking-tighter text-amber-600">
                      Live
                    </span>
                    <div className="h-1 w-1 rounded-full bg-amber-500 animate-ping" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 4).map((ev) => {
                  const color = lessonColorMap[ev.lesson_id] || FALLBACK_COLOR;
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => handleEventClick(e, ev)}
                      className={`
                        w-full text-left px-2 py-1.5 rounded border border-transparent transition-all
                        ${color.bg} ${color.text} hover:shadow-sm
                        ${isTodayDate ? 'border-amber-200/50' : ''}
                      `}
                    >
                      <div className="text-[9px] font-black uppercase leading-tight truncate">
                        {ev.title}
                      </div>
                      <div className="text-[8px] font-bold opacity-70 tracking-tighter">
                        {formatTime(ev.start_time)}
                      </div>
                    </button>
                  );
                })}
                {dayEvents.length > 4 && (
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center pt-1">
                    + {dayEvents.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BookingModal
        event={selectedEvent}
        date={selectedDate}
        sessions={bookingsForDate}
        onError={onError}
        onAddAvailability={onAddAvailability}
        onClose={() => {
          setSelectedEvent(null);
          setSelectedDate(null);
          setBookingsForDate([]);
        }}
      />
    </div>
  );
}
