'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useReservation } from './ReservationContext';
import { ChartBarIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { createBooking } from '../_lib/actions';
import { differenceInCalendarWeeks } from 'date-fns';
import SubmitButton from './SubmitButton';

function ReservationForm({ opportunity, user, bookedCounts }) {
  const {
    range,
    resetRange,
    students: shareholders,
    setStudents: setShareholders,
  } = useReservation();
  const { maxCapacity, id } = opportunity;
  const formRef = useRef(null);

  const totalWeeks =
    range?.from && range?.to
      ? differenceInCalendarWeeks(range.to, range.from, { weekStartsOn: 1 }) + 1
      : 0;

  // Keeping your 6-week rule for the briefing series
  const isValidSelection = totalWeeks === 6;

  useEffect(() => {
    if (isValidSelection && formRef.current) {
      const timeoutId = setTimeout(() => {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(timeoutId);
    }
  }, [isValidSelection]);

  const startDate = range.from;
  const endDate = range.to;

  // Calculate seat availability for the briefing
  let availableSeats = maxCapacity;
  if (startDate && bookedCounts) {
    const startKey = new Date(startDate).toISOString().split('T')[0];
    availableSeats = Math.max(maxCapacity - (bookedCounts[startKey] || 0), 0);
  }

  // Attendance data for the action
  const bookingData = {
    startDate,
    endDate,
    opportunityId: id,
    numShareholders: shareholders,
  };

  const createBookingWithData = createBooking.bind(null, bookingData);

  return (
    <div ref={formRef} className="w-full h-full flex flex-col scroll-mt-20">
      {/* Header: Profile & Status */}
      <div className="bg-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image
              src={user?.image || '/default-avatar.jpg'}
              alt={user?.name}
              fill
              className="rounded-full border-2 border-white shadow-sm object-cover"
            />
          </div>
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
              Investor
            </p>
            <p className="font-bold text-slate-900 text-sm">{user?.name}</p>
          </div>
        </div>
        <ShieldCheckIcon className="h-6 w-6 text-primary-600 opacity-20" />
      </div>

      <form
        action={async (formData) => {
          if (!user) return;
          await createBookingWithData(formData);
          resetRange();
        }}
        className="bg-slate-900 p-6 md:p-10 flex flex-col gap-6 flex-grow rounded-b-2xl text-white"
      >
        {/* Shareholder Count */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Attendees / Shareholders
          </label>
          <select
            name="numShareholders"
            className="w-full px-4 py-4 bg-slate-800 text-white border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none appearance-none"
            value={shareholders}
            onChange={(e) => setShareholders(Number(e.target.value))}
            required
          >
            <option value="">Select number of seats...</option>
            {Array.from(
              { length: Math.min(availableSeats, 5) },
              (_, i) => i + 1
            ).map((x) => (
              <option value={x} key={x}>
                {x} {x === 1 ? 'Shareholder' : 'Shareholders'}
              </option>
            ))}
          </select>
        </div>

        {/* Capacity / Governance Info */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start gap-3">
          <ChartBarIcon className="h-5 w-5 text-primary-400 shrink-0" />
          <div>
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
              Briefing Capacity
            </p>
            <p className="text-sm font-medium text-slate-200">
              {availableSeats > 0
                ? `${availableSeats} seats remaining for this session series`
                : 'Session is currently at maximum capacity'}
            </p>
          </div>
        </div>

        {/* Agenda / Observations */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Agenda Items / Discussion Points
          </label>
          <textarea
            name="observations"
            className="w-full px-4 py-4 bg-slate-800 text-white border border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            placeholder="List any specific asset metrics or governance topics you wish to discuss..."
            rows={4}
          />
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-4">
          {!isValidSelection ? (
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl text-center">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                Please select a 6-week briefing window
              </p>
            </div>
          ) : (
            <SubmitButton pendingLabel="Registering Attendance...">
              Confirm Briefing Attendance &rarr;
            </SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}

export default ReservationForm;
