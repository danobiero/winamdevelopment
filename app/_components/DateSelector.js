'use client';

import {
  addMonths,
  differenceInCalendarWeeks,
  isBefore,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { useEffect, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useReservation } from './ReservationContext';

function DateSelector({ session, opportunity, bookedDates = [] }) {
  const { range, setRange, resetRange } = useReservation();
  const [selectedRange, setSelectedRange] = useState(null);
  const [monthsToShow, setMonthsToShow] = useState(1);
  const [isHovering, setIsHovering] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [month, setMonth] = useState(today);

  useEffect(() => {
    const handleResize = () => {
      setMonthsToShow(window.innerWidth >= 1024 ? 2 : 1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const MAX_WEEKS = 6;
  const totalWeeks =
    range?.from && range?.to
      ? differenceInCalendarWeeks(range.to, range.from, { weekStartsOn: 1 }) + 1
      : 0;

  const isCalendarLocked = totalWeeks >= MAX_WEEKS;

  const handleDayClick = (day) => {
    if (!session || !day || (isCalendarLocked && !selectedRange?.from)) return;

    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(day, { weekStartsOn: 1 });
    const validStart = isBefore(weekStart, today) ? today : weekStart;

    if (!selectedRange?.from) {
      const newRange = { from: validStart, to: weekEnd };
      setSelectedRange(newRange);
      setRange(newRange);
    } else {
      const start =
        selectedRange.from < validStart ? selectedRange.from : validStart;
      const end = selectedRange.to > weekEnd ? selectedRange.to : weekEnd;
      const weeks =
        differenceInCalendarWeeks(end, start, { weekStartsOn: 1 }) + 1;

      if (weeks > MAX_WEEKS) return;

      const newRange = { from: start, to: end };
      setSelectedRange(newRange);
      setRange(newRange);
    }
  };

  const handleReset = () => {
    setSelectedRange(null);
    setRange({});
    resetRange();
    setMonth(today);
  };

  return (
    <div className="relative flex flex-col items-center w-full py-6 px-4 h-full">
      {/* 🔹 STATIC HOVER NOTICE */}
      <div
        className={`mb-4 h-8 flex items-center transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
      >
        <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg">
          Reservation Required
        </span>
      </div>

      <div
        className="w-full flex justify-center overflow-x-auto pb-4 scrollbar-hide"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <DayPicker
          className={`mx-auto transition ${!session || isCalendarLocked ? 'opacity-50 pointer-events-none' : ''}`}
          mode="single"
          selected={selectedRange?.from}
          onDayClick={handleDayClick}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={monthsToShow}
          disabled={[{ before: today }, ...bookedDates.map((d) => new Date(d))]}
          modifiers={{
            selected: selectedRange,
            saturdaySession: (date) =>
              selectedRange &&
              date.getDay() === 6 &&
              date >= selectedRange.from &&
              date <= selectedRange.to,
          }}
          captionLayout="dropdown"
          startMonth={today}
          endMonth={addMonths(today, 12)}
          modifiersClassNames={{
            selected: 'bg-slate-200 text-slate-900 rounded-lg',
            saturdaySession:
              '!bg-primary-600 !text-white font-black rounded-md shadow-md',
          }}
          styles={{
            day: { width: '36px', height: '36px' },
          }}
        />
      </div>

      {/* 🔹 LEGEND */}
      <div className="flex justify-center flex-wrap gap-6 text-[10px] uppercase font-black text-slate-400 mt-6 mb-8 tracking-widest">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 bg-slate-200 rounded-sm"></span> Selection
          Range
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 bg-primary-600 rounded-sm shadow-sm"></span>{' '}
          Open Briefings (Sat)
        </span>
      </div>

      {/* 🔹 ACTION FOOTER */}
      <div className="w-full max-w-sm bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center mt-auto">
        <h5 className="text-slate-900 font-black uppercase tracking-tighter text-lg">
          {totalWeeks > 0
            ? `${totalWeeks} Week Briefing Period`
            : 'Select Attendance Range'}
        </h5>

        {totalWeeks > 0 && (
          <p className="text-xs font-bold text-slate-500 mt-2 leading-relaxed">
            You are requesting shareholder access for{' '}
            <span className="text-primary-600">{totalWeeks} Saturday</span>{' '}
            sessions.
          </p>
        )}

        {selectedRange?.from && (
          <button
            onClick={handleReset}
            className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition-colors"
          >
            [ Clear Selection ]
          </button>
        )}
      </div>
    </div>
  );
}

export default DateSelector;
