'use client';

import {
  addDays,
  addMonths,
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
   COLOR PALETTE (PER SESSION_KEY)
   ============================================================ */
const COLOR_POOL = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-900' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900' },
  { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900' },
];

const FALLBACK_COLOR = {
  bg: 'bg-gray-100',
  border: 'border-gray-300',
  text: 'text-gray-800',
};

/* ============================================================
   TIME FORMATTER
   ============================================================ */
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
      <div className="text-red-600 font-semibold">
        CalendarGrid Error: Invalid event data
      </div>
    );
  }

  /* ===================== MONTH GRID ===================== */
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  let day = weekStart;
  while (day <= weekEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  /* ===================== EVENTS BY DATE ===================== */
  const eventMap = useMemo(() => {
    const map = {};
    events.forEach((ev) => {
      const key = format(new Date(ev.start_time), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });
    return map;
  }, [events]);

  /* ===================== SESSION_KEY COLORS ===================== */
  const sessionColorMap = useMemo(() => {
    const map = {};
    const keys = Array.from(
      new Set(events.map((e) => e.session_key).filter(Boolean))
    ).sort();

    keys.forEach((key, i) => {
      map[key] = COLOR_POOL[i % COLOR_POOL.length];
    });

    return map;
  }, [events]);

  /* ===================== CLICK HANDLERS ===================== */
  const handleDateClick = (dateKey) => {
    setSelectedEvent(null);
    setSelectedDate(dateKey);
    setBookingsForDate([]);
    setDateError(null);
  };

  const handleEventClick = (e, ev) => {
    e.preventDefault();
    e.stopPropagation();

    // 🔑 close date modal first (prevents overlay conflicts)
    setSelectedDate(null);
    setBookingsForDate([]);
    setDateError(null);
    setIsLoadingDate(false);

    // 🔑 then open event modal
    setSelectedEvent(ev);
  };

  /* ===================== LOAD BOOKINGS AFTER DATE SELECT ===================== */
  useEffect(() => {
    if (!selectedDate) return;

    let active = true;

    const loadBookings = async () => {
      try {
        setIsLoadingDate(true);

        const sessions = await getAdminBookingsForDate(selectedDate);

        if (active) {
          setBookingsForDate(sessions || []);
        }
      } catch (err) {
        console.error('Failed to load bookings for date:', err);
        if (active) {
          setDateError('Unable to load bookings for this date.');
        }
      } finally {
        if (active) {
          setIsLoadingDate(false);
        }
      }
    };

    loadBookings();

    return () => {
      active = false;
    };
  }, [selectedDate]);

  return (
    <div>
      {/* ===================== HEADER ===================== */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          ← Prev
        </button>

        <h3 className="text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Next →
        </button>
      </div>

      {/* ===================== CALENDAR GRID ===================== */}
      <div className="grid grid-cols-7 gap-2 border rounded-lg p-4 bg-white shadow">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center font-semibold">
            {d}
          </div>
        ))}

        {days.map((dayItem, idx) => {
          const dateKey = format(dayItem, 'yyyy-MM-dd');
          const dayEvents = eventMap[dateKey] || [];

          return (
            <div
              key={idx}
              onClick={(e) => {
                // ✅ DO NOT trigger date modal if clicking on an event button
                if (e.target.closest('button')) return;
                handleDateClick(dateKey);
              }}
              className={`border p-2 rounded min-h-[140px] flex flex-col gap-1 cursor-pointer
                ${
                  isSameMonth(dayItem, currentMonth)
                    ? 'bg-white hover:bg-blue-50'
                    : 'bg-gray-100 text-gray-400'
                }
                ${
                  isToday(dayItem)
                    ? 'bg-yellow-100 border-yellow-400 shadow-md'
                    : ''
                }
              `}
            >
              <div className="font-semibold">{format(dayItem, 'd')}</div>

              {dayEvents.map((ev) => {
                const color = sessionColorMap[ev.session_key] || FALLBACK_COLOR;

                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={(e) => handleEventClick(e, ev)}
                    className={`text-xs px-2 py-1 rounded text-left
                      ${color.bg} ${color.text} ${color.border}
                      hover:opacity-90`}
                  >
                    <div className="font-semibold truncate">{ev.title}</div>
                    <div className="text-[10px] opacity-80">
                      {formatTime(ev.start_time)} – {formatTime(ev.end_time)}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ===================== MODALS ===================== */}
      <BookingModal
        event={selectedEvent}
        date={selectedDate}
        sessions={bookingsForDate}
        onError={onError}
        onAddAvailability = { onAddAvailability }
        onClose={() => {
          setSelectedEvent(null);
          setSelectedDate(null);
          setBookingsForDate([]);
          
          
        }}
      />
    </div>
  );
}
