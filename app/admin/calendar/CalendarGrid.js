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
import { getInvestorsForOpportunity } from './actions';

/* ============================================================
   COLOR PALETTE (PER OPPORTUNITY/LESSON ID)
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
  return format(new Date(ts), 'h:mm a');
}

export default function CalendarGrid({ events, onError, onAddAvailability }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Updated State
  const [investorsForOpportunity, setInvestorsForOpportunity] = useState([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [investorsError, setInvestorsError] = useState(null);

  if (!Array.isArray(events)) {
    return (
      <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-xs font-black uppercase tracking-widest text-rose-500">
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
      // Use start_time if it exists, otherwise fall back to created_at
      const targetDate = ev.start_time || ev.created_at;

      // Safety check: if there's no date at all, skip rendering it
      if (!targetDate) return;

      const key = format(new Date(targetDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  const lessonColorMap = useMemo(() => {
    const map = {};
    // Using string conversion to ensure stable matching for opportunity IDs
    const ids = Array.from(
      new Set(events.map((e) => String(e.id)).filter(Boolean))
    ).sort();

    ids.forEach((id, i) => {
      map[id] = COLOR_POOL[i % COLOR_POOL.length];
    });
    return map;
  }, [events]);

  /* ===================== HANDLERS ===================== */
  const handleDateClick = (dateKey) => {
    setSelectedEvent(null);
    setSelectedDate(dateKey);
    setInvestorsForOpportunity([]);
    setInvestorsError(null);
  };

  const handleEventClick = (e, ev) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDate(null);
    setSelectedEvent(ev);
  };

  useEffect(() => {
    if (!selectedEvent) return;

    let active = true;
    const loadInvestors = async () => {
      try {
        setIsLoadingInvestors(true);
        // FIX: Ensure we use the correct ID for the database lookup
        const targetId = selectedEvent.opportunity_id || selectedEvent.id;
        const investors = await getInvestorsForOpportunity(targetId);

        if (active) setInvestorsForOpportunity(investors || []);
      } catch (err) {
        if (active)
          setInvestorsError('Failed to load investors for this opportunity.');
      } finally {
        if (active) setIsLoadingInvestors(false);
      }
    };

    loadInvestors();

    return () => {
      active = false;
    };
  }, [selectedEvent]);

  // FIX: Compute the events for the clicked date to pass to the modal
  const selectedDateEvents = selectedDate ? eventMap[selectedDate] || [] : [];

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
            className="px-3 py-1 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors"
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
            className="py-2.5 text-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b border-r border-slate-100 last:border-r-0 bg-white"
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
              onClick={() => handleDateClick(dateKey)}
              className={`
                relative min-h-[130px] p-2 border-b border-r border-slate-100 last:border-r-0 cursor-pointer transition-colors
                ${isCurrentMonth ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/30 text-slate-300'}
                ${isTodayDate ? 'bg-amber-50/70 border-l-4 border-l-amber-400 z-10' : ''}
              `}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`
                  text-xs font-black px-1.5 py-0.5 rounded-md shadow-sm
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
                  const color = lessonColorMap[String(ev.id)] || FALLBACK_COLOR;
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
                      <div className="text-xs font-black uppercase leading-tight truncate">
                        {ev.title || ev.name}{' '}
                        {/* Support both naming conventions */}
                      </div>
                      <div className="text-xs font-bold opacity-70 tracking-tighter">
                        {formatTime(ev.start_time || ev.created_at)}
                      </div>
                    </button>
                  );
                })}
                {dayEvents.length > 4 && (
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest text-center pt-1">
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
        dayOpportunities={selectedDateEvents} // <-- NEW: Passes the day's events to the modal
        investors={investorsForOpportunity}
        isLoading={isLoadingInvestors}
        error={investorsError}
        onError={onError}
        onAddAvailability={onAddAvailability}
        onClose={() => {
          setSelectedEvent(null);
          setSelectedDate(null);
          setInvestorsForOpportunity([]);
          setInvestorsError(null);
        }}
      />
    </div>
  );
}
