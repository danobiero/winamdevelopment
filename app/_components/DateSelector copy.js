'use client';

import {
  addMonths,
  addWeeks,
  differenceInCalendarWeeks,
  endOfWeek,
  isBefore,
  startOfWeek
} from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { DayPicker, rangeIncludesDate } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useReservation } from './ReservationContext';

function DateSelector({ session, settings, lesson, bookedDates = [] }) {
  const { regularPrice, discount } = lesson;
  const { range, setRange, resetRange, students } = useReservation();
  const [selectedRange, setSelectedRange] = useState(null);
  const [monthsToShow, setMonthsToShow] = useState(1);

  const loginMessageRef = useRef(null);

  // Responsive months: 2 months on md/lg
  useEffect(() => {
    const handleResize = () => {
      setMonthsToShow(window.innerWidth >= 640 ? 2 : 1);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const MAX_WEEKS = 6;

  const totalPrice = (regularPrice - discount) * students;
  const totalWeeks =
    range?.from && range?.to
      ? differenceInCalendarWeeks(range.to, range.from, { weekStartsOn: 1 }) + 1
      : 0;

  const endLimit =
    totalWeeks >= MAX_WEEKS && selectedRange?.from
      ? addWeeks(selectedRange.from, MAX_WEEKS)
      : null;

  const disabledDays = [
    { before: today },
    ...bookedDates.map((d) => new Date(d)),
    ...(endLimit ? [{ after: endLimit }] : []),
  ];

  const handleDayClick = (day) => {
    if (!session) {
      // Scroll login message into view
      loginMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    if (!day) return;

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

      const totalWeeks =
        differenceInCalendarWeeks(end, start, { weekStartsOn: 1 }) + 1;
      if (totalWeeks > MAX_WEEKS) return;

      const newRange = { from: start, to: end };
      setSelectedRange(newRange);
      setRange(newRange);
    }
  };

  const modifiers = {
    selected: selectedRange,
    range_start: selectedRange?.from,
    range_end: selectedRange?.to,
    range_middle: (date) =>
      selectedRange
        ? rangeIncludesDate(date, selectedRange, { excludeEnds: true })
        : false,
  };

  return (
    <div className="flex flex-col justify-between rounded-xl">
      {/* Calendar */}
      <DayPicker
        className={`pt-6 place-self-center transition-opacity duration-200 ${
          !session ? 'opacity-50 pointer-events-none' : ''
        }`}
        mode="single"
        selected={selectedRange?.from}
        onDayClick={handleDayClick}
        month={range.month || today}
        onMonthChange={(m) => setRange({ ...range, month: m })}
        modifiers={modifiers}
        disabled={disabledDays}
        startMonth={today}
        endMonth={addMonths(today, 12)}
        captionLayout="dropdown"
        numberOfMonths={monthsToShow}
        modifiersClassNames={{
          selected: 'bg-blue-700 text-white rounded-lg',
          range_start: 'rounded-l-xl bg-blue-700 text-white shadow-md',
          range_end: 'rounded-r-xl bg-blue-700 text-white shadow-md',
          range_middle:
            'bg-blue-300 text-white border-t border-b border-blue-400 shadow-inner',
          disabled: 'text-gray-400 pointer-events-none opacity-40',
        }}
      />

      {/* Legend */}
      <div className="flex justify-center gap-3 text-xs sm:text-sm text-gray-700 mt-2">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 bg-blue-700 rounded-sm inline-block"></span>{' '}
          Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 bg-blue-300 rounded-sm inline-block"></span>{' '}
          In Range
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 bg-gray-300 rounded-sm inline-block"></span>{' '}
          Unavailable
        </span>
      </div>

      {/* Selected weeks summary */}
      {selectedRange && (
        <p className="mt-2 px-6 text-sm sm:text-base text-white bg-logo-100">
          From {selectedRange.from.toLocaleDateString()} To{' '}
          {selectedRange.to.toLocaleDateString()} (
          {differenceInCalendarWeeks(selectedRange.to, selectedRange.from, {
            weekStartsOn: 1,
          }) + 1}{' '}
          weeks)
        </p>
      )}

      {/* Pricing info */}
      <div
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between 
             px-4 sm:px-6 md:px-8 py-4 
             bg-logo-10 text-primary-800 rounded-xl mt-4 w-full"
      >
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 md:gap-8">
          <p className="flex flex-wrap gap-2 items-baseline text-lg sm:text-xl md:text-2xl">
            {discount > 0 ? (
              <>
                <span className="font-bold text-primary-900">
                  ${regularPrice - discount}
                </span>
                <span className="line-through text-primary-700 text-sm sm:text-base">
                  ${regularPrice}
                </span>
              </>
            ) : (
              <span className="font-bold text-primary-900">
                ${regularPrice}
              </span>
            )}
            <span className="font-medium">
              × {students} {students === 1 ? 'Student' : 'Students'}
            </span>
          </p>

          {totalWeeks ? (
            <p
              className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl 
                     bg-yellow-200 px-3 py-2 rounded-lg shadow-sm"
            >
              <span className="font-bold uppercase text-primary-700">
                Total
              </span>
              <span className="font-semibold text-primary-900">
                ${totalPrice.toLocaleString()}
              </span>
            </p>
          ) : null}
        </div>

        {selectedRange && (
          <button
            className="w-full sm:w-auto
                 rounded-lg border border-primary-800 bg-white
                 px-4 py-2 text-sm sm:text-base md:text-lg font-semibold
                 text-primary-800 hover:bg-primary-800 hover:text-white
                 transition-colors"
            onClick={() => {
              setSelectedRange(null);
              setRange({});
              resetRange();
            }}
          >
            Clear
          </button>
        )}
      </div>

      {totalWeeks === 6 && (
        <p className="mt-4 text-sm sm:text-base text-green-800 font-medium bg-green-100 px-4 py-2 rounded-md shadow-sm w-full">
          ✅ 6-week session selected — ready to reserve.
        </p>
      )}

      {/* Login prompt for unauthenticated users */}
      {!session && (
        <p
          ref={loginMessageRef}
          className="mt-4 text-sm sm:text-base text-center text-red-600 font-medium bg-red-50 px-4 py-2 rounded-md shadow-sm"
        >
          Please log in to select session dates.
        </p>
      )}
    </div>
  );
}

export default DateSelector;
