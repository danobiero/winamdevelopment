'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  Squares2X2Icon,
  VideoCameraIcon,
  ClockIcon,
} from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  parseISO,
  isValid,
  isBefore,
  isAfter,
} from 'date-fns';

import EventModal from './InvestorEventModal';

/* ============================================================
   COLOR PALETTE (PER INVESTMENT / OPPORTUNITY)
   ============================================================ */
const COLOR_POOL = [
  { bg: 'bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100/80 dark:hover:bg-blue-900/60', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100/80 dark:hover:bg-purple-900/60', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-800 dark:text-purple-300', dot: 'bg-purple-500' },
  { bg: 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100/80 dark:hover:bg-amber-900/60', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100/80 dark:hover:bg-rose-900/60', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-800 dark:text-indigo-300', dot: 'bg-indigo-500' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100/80 dark:hover:bg-cyan-900/60', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-800 dark:text-cyan-300', dot: 'bg-cyan-500' },
];

const FALLBACK_COLOR = {
  bg: 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700',
  border: 'border-slate-200 dark:border-slate-700',
  text: 'text-slate-700 dark:text-slate-300',
  dot: 'bg-slate-400',
};

function getEventDate(timeValue) {
  if (!timeValue) return null;
  if (timeValue instanceof Date && isValid(timeValue)) return timeValue;
  const parsed =
    typeof timeValue === 'string' ? parseISO(timeValue) : new Date(timeValue);
  if (isValid(parsed)) return parsed;
  const directDate = new Date(timeValue);
  return isValid(directDate) ? directDate : null;
}

function formatEventTime(timeStr) {
  if (!timeStr) return '';
  try {
    const d = getEventDate(timeStr);
    if (d) {
      return format(d, 'h:mm a');
    }
  } catch (err) {
    // Return original string if not parsable
  }
  return timeStr;
}

export default function ShareholderCalendar({ eventsByDate = {}, events = null }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [modalEvents, setModalEvents] = useState(null);
  const [modalDate, setModalDate] = useState(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ===================== EXTRACT ALL FLAT EVENTS ===================== */
  const allEvents = useMemo(() => {
    if (Array.isArray(events) && events.length > 0) return events;
    const flat = [];
    Object.entries(eventsByDate || {}).forEach(([dateStr, dayEvents]) => {
      if (Array.isArray(dayEvents)) {
        dayEvents.forEach((ev) => {
          flat.push({ ...ev, dateStr: ev.dateStr || dateStr });
        });
      }
    });
    return flat;
  }, [events, eventsByDate]);

  /* ===================== MONTH GRID COMPUTATIONS ===================== */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  /* ===================== CLIENT-SIDE EVENT MAPPING ===================== */
  const clientEventsByDate = useMemo(() => {
    if (allEvents.length === 0) return eventsByDate || {};
    const map = {};
    allEvents.forEach((ev) => {
      const targetDate = ev.start_time || ev.startTime || ev.dateStr;
      if (!targetDate) return;
      const key = format(new Date(targetDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push({ ...ev, dateStr: key });
    });
    return map;
  }, [allEvents, eventsByDate]);

  /* ===================== INVESTMENT COLOR MAPPING ===================== */
  const investmentMap = useMemo(() => {
    const map = {};
    let colorIdx = 0;

    allEvents.forEach((e) => {
      const key = e.investmentId || e.investmentName || 'default';
      if (!map[key]) {
        map[key] = {
          id: key,
          name: e.investmentName || 'Shareholder Briefing',
          color: COLOR_POOL[colorIdx % COLOR_POOL.length],
        };
        colorIdx++;
      }
    });

    return map;
  }, [allEvents]);

  /* ===================== FLAT LIST OF EVENTS FOR AGENDA ===================== */
  const sortedEventList = useMemo(() => {
    return [...allEvents].sort((a, b) => {
      const timeA = new Date(a.start_time || a.dateStr || 0).getTime();
      const timeB = new Date(b.start_time || b.dateStr || 0).getTime();
      return timeA - timeB;
    });
  }, [allEvents]);

  /* ===================== TOTAL EVENT COUNT ===================== */
  const totalEvents = useMemo(() => {
    return allEvents.length;
  }, [allEvents]);

  /* ===================== NAVIGATION HANDLERS ===================== */
  const goPrev = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goNext = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToday = () => setCurrentMonth(startOfMonth(new Date()));

  const handleDateClick = (date, dayEvents) => {
    setModalDate(date);
    setModalEvents(dayEvents);
  };

  const numWeeks = Math.max(1, Math.ceil(days.length / 7));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex-1 min-h-0 flex flex-col overflow-hidden w-full transition-colors duration-200">
      {/* ===== TOP CONTROL & LEGEND BAR ===== */}
      <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col gap-2 shrink-0">
        {/* MONTH TITLE & NAVIGATION CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm sm:text-base font-black text-[#000033] dark:text-white uppercase tracking-wider">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200/60 dark:border-blue-800/60">
              {totalEvents} {totalEvents === 1 ? 'Meeting' : 'Meetings'} Scheduled
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* VIEW MODE TOGGLE */}
            <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#000033] dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Squares2X2Icon className="h-3 w-3" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#000033] dark:bg-blue-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ListBulletIcon className="h-3 w-3" />
                List
              </button>
            </div>

            {/* MONTH NAV */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrev}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={goToday}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
              >
                Today
              </button>

              <button
                type="button"
                onClick={goNext}
                className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-all text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-2xs cursor-pointer"
                title="Next Month"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* PORTFOLIO HOLDINGS LEGEND */}
        {Object.keys(investmentMap).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-200/40 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 mr-1">
              Holdings:
            </span>
            {Object.values(investmentMap).map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-semibold ${item.color.bg} ${item.color.border} ${item.color.text}`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${item.color.dot}`} />
                <span className="truncate max-w-[150px]">{item.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== VIEW CONTENT: GRID VIEW OR LIST VIEW ===== */}
      {viewMode === 'grid' ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden w-full">
          {/* DAY HEADERS */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="py-1.5 text-center text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 last:border-r-0"
              >
                {d}
              </div>
            ))}
          </div>

          {/* DAY CELLS GRID (Fills 100% of height proportionally across weeks) */}
          <div
            className="flex-1 min-h-0 grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden"
            style={{
              gridTemplateRows: `repeat(${numWeeks}, minmax(0, 1fr))`,
            }}
          >
            {days.map((dayItem, idx) => {
              const dateKey = format(dayItem, 'yyyy-MM-dd');
              const dayEvents = clientEventsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(dayItem, currentMonth);
              const isTodayDate = isToday(dayItem);

              return (
                <div
                  key={idx}
                  onClick={() => handleDateClick(dayItem, dayEvents)}
                  className={`
                    relative p-1 sm:p-1.5 cursor-pointer transition-colors flex flex-col justify-between overflow-hidden min-h-0
                    ${isCurrentMonth ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/70 dark:hover:bg-slate-800/60' : 'bg-slate-50/30 dark:bg-slate-950/60 text-slate-300 dark:text-slate-600'}
                    ${isTodayDate ? 'bg-amber-50/60 dark:bg-amber-950/30 border-l-2 border-l-amber-400 z-10' : ''}
                  `}
                >
                  {/* DATE NUMBER & TODAY BADGE */}
                  <div className="flex justify-between items-center mb-0.5 shrink-0">
                    <span
                      className={`
                        text-xs sm:text-sm font-black px-1.5 py-0.5 rounded shadow-2xs leading-tight
                        ${isTodayDate ? 'bg-[#000033] dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}
                      `}
                    >
                      {format(dayItem, 'd')}
                    </span>

                    {isTodayDate && (
                      <span className="text-xs sm:text-xs font-bold uppercase text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/50 px-1 rounded">
                        Today
                      </span>
                    )}
                  </div>

                  {/* SCHEDULED EVENT CHIPS */}
                  <div className="space-y-0.5 flex-1 min-h-0 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const invKey = ev.investmentId || ev.investmentName || 'default';
                      const colorScheme = investmentMap[invKey]?.color || FALLBACK_COLOR;
                      const eventTime = formatEventTime(ev.time || ev.start_time);
                      const startDt = getEventDate(ev.start_time || ev.startTime || (ev.dateStr ? `${ev.dateStr}T00:00:00` : null));
                      const rawEndDt = getEventDate(ev.endTime || ev.end_time);
                      const endDt = rawEndDt || (startDt ? new Date(startDt.getTime() + 60 * 60 * 1000) : null);
                      const isPast = endDt ? isBefore(endDt, now) : (startDt ? isBefore(startDt, now) : false);

                      return (
                        <div
                          key={ev.id}
                          className={`
                            w-full text-left px-1.5 py-0.5 rounded border transition-all truncate
                            ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text}
                            ${isPast ? 'opacity-60 line-through' : ''}
                          `}
                        >
                          <div className="text-xs sm:text-xs font-bold truncate leading-tight">
                            {ev.title || 'Briefing'}
                          </div>
                          {eventTime && (
                            <div className="hidden lg:block text-xs opacity-75 truncate leading-none">
                              {eventTime}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {dayEvents.length > 2 && (
                      <div className="text-xs font-bold text-slate-400 dark:text-slate-500 text-center leading-none">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ===== LIST / AGENDA VIEW ===== */
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2.5 custom-scrollbar">
          {sortedEventList.length > 0 ? (
            sortedEventList.map((ev) => {
              const invKey = ev.investmentId || ev.investmentName || 'default';
              const colorScheme = investmentMap[invKey]?.color || FALLBACK_COLOR;
              const startDt = getEventDate(ev.start_time || ev.startTime || (ev.dateStr ? `${ev.dateStr}T00:00:00` : null));
              const rawEndDt = getEventDate(ev.endTime || ev.end_time);
              const endDt = rawEndDt || (startDt ? new Date(startDt.getTime() + 60 * 60 * 1000) : null);

              const isPast = endDt
                ? isBefore(endDt, now)
                : startDt
                  ? isBefore(startDt, now)
                  : false;

              const isLive = Boolean(
                startDt &&
                endDt &&
                isAfter(now, startDt) &&
                isBefore(now, endDt)
              );

              const eventDateStr = startDt
                ? format(startDt, 'EEEE, MMMM d, yyyy')
                : ev.dateStr
                  ? format(new Date(ev.dateStr + 'T00:00:00'), 'EEEE, MMMM d, yyyy')
                  : '';
              const eventTimeStr = formatEventTime(ev.time || ev.start_time);
              const eventEndTimeStr = rawEndDt ? formatEventTime(rawEndDt) : null;

              return (
                <div
                  key={ev.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative ${
                    isPast
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 opacity-60'
                      : isLive
                        ? 'bg-white dark:bg-slate-800 border-green-300 dark:border-green-800 shadow-md ring-1 ring-green-100 dark:ring-green-900/30'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* LIVE BADGE */}
                  {isLive && (
                    <div className="absolute -top-2.5 right-3 flex items-center gap-1.5 bg-green-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-tight animate-pulse shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-100"></span>
                      </span>
                      Live Now
                    </div>
                  )}

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase border ${colorScheme.bg} ${colorScheme.border} ${colorScheme.text}`}>
                        {ev.investmentName || 'Portfolio Event'}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 flex items-center gap-1">
                        <ClockIcon className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        {eventDateStr} {eventTimeStr && `at ${eventTimeStr}`}
                        {eventEndTimeStr && ` — ${eventEndTimeStr}`}
                      </span>
                      {isPast && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                          <CheckCircleIcon className="h-3.5 w-3.5 text-slate-400" />
                          Ended
                        </span>
                      )}
                    </div>
                    <h3
                      className={`text-sm font-bold leading-tight truncate ${
                        isPast ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {ev.title || 'Shareholder Event'}
                    </h3>
                    {ev.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                        {ev.description}
                      </p>
                    )}
                  </div>

                  {/* ACTION BUTTON / CONCLUDED STATUS */}
                  {(ev.meetLink || ev.meet_link) && (
                    isPast ? (
                      <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold text-center border border-slate-200 dark:border-slate-700 italic shrink-0 w-full sm:w-auto">
                        Meeting has concluded
                      </div>
                    ) : isLive ? (
                      <a
                        href={ev.meetLink || ev.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 w-full sm:w-auto justify-center cursor-pointer shadow-sm animate-pulse"
                      >
                        <VideoCameraIcon className="h-3.5 w-3.5" />
                        Join Ongoing Meeting
                      </a>
                    ) : (
                      <a
                        href={ev.meetLink || ev.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-950 dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 w-full sm:w-auto justify-center cursor-pointer shadow-2xs"
                      >
                        <VideoCameraIcon className="h-3.5 w-3.5" />
                        Join Meeting
                      </a>
                    )
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
              No upcoming shareholder meetings scheduled
            </div>
          )}
        </div>
      )}

      {/* ===== EVENT DETAILS MODAL ===== */}
      {modalDate && (
        <EventModal
          events={modalEvents || []}
          date={modalDate}
          onClose={() => {
            setModalEvents(null);
            setModalDate(null);
          }}
        />
      )}
    </div>
  );
}
