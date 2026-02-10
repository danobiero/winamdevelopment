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
import { FormatCurrency } from '../_lib/utils';

function DateSelector({ session, lesson, bookedDates = [] }) {
  const { regularPrice, discount } = lesson;
  const { range, setRange, resetRange, students } = useReservation();
  const [selectedRange, setSelectedRange] = useState(null);
  const [monthsToShow, setMonthsToShow] = useState(1);

  // 1. Add state to control the current month view
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

  const totalPrice = (regularPrice - discount) * students;
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

  // 2. Updated Reset Logic
  const handleReset = () => {
    setSelectedRange(null);
    setRange({});
    resetRange();
    setMonth(today); // This snaps the calendar back to the current month
  };

  return (
    <div
      className="flex flex-col items-center w-full py-6 px-4 h-full"
      id="calendar-section"
    >
      <div className="w-full flex justify-center overflow-x-auto pb-2 scrollbar-hide">
        <DayPicker
          className={`mx-auto transition ${!session || isCalendarLocked ? 'opacity-50 pointer-events-none' : ''}`}
          mode="single"
          selected={selectedRange?.from}
          onDayClick={handleDayClick}
          // 3. Controlled month props
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
            selected: 'bg-blue-300 text-white rounded-lg',
            saturdaySession: '!bg-orange-500 !text-white font-bold rounded-md',
          }}
          styles={{
            day: { width: '34px', height: '34px', maxWidth: '34px' },
          }}
        />
      </div>

      <div className="flex justify-center flex-wrap gap-4 text-[10px] uppercase font-black text-primary-400 mt-4 mb-8">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 bg-blue-300 rounded-full shadow-sm"></span>{' '}
          Range
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></span>{' '}
          Open Sessions
        </span>
      </div>

      <div className="w-full max-w-sm bg-primary-50/50 p-4 rounded-2xl border border-primary-100 text-center mt-auto">
        <p className="text-xl sm:text-2xl font-black text-blue-950">
          {FormatCurrency(regularPrice - discount)}
          <span className="text-xs font-bold text-primary-400 ml-2 uppercase tracking-wide">
            / student
          </span>
        </p>

        {totalWeeks > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-bold text-logo-100 italic">
              {totalWeeks} Weeks Selected — Total: {FormatCurrency(totalPrice)}
            </p>
          </div>
        )}

        {selectedRange?.from && (
          <button
            onClick={handleReset}
            className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-primary-300 hover:text-red-500 transition-colors"
          >
            [ Reset ]
          </button>
        )}
      </div>
    </div>
  );
}

export default DateSelector;
