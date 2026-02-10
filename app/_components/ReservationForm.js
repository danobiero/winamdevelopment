'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useReservation } from './ReservationContext';
import { UsersIcon } from '@heroicons/react/24/solid';
import { createBooking } from '../_lib/actions';
import { differenceInCalendarWeeks } from 'date-fns';
import SubmitButton from './SubmitButton';

function ReservationForm({ lesson, user, bookedCounts }) {
  const { range, resetRange, students, setStudents } = useReservation();
  const { maxCapacity, regularPrice, discount, id } = lesson;
  const formRef = useRef(null);

  const totalWeeks =
    range?.from && range?.to
      ? differenceInCalendarWeeks(range.to, range.from, { weekStartsOn: 1 }) + 1
      : 0;

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

  let availableSpots = maxCapacity;
  if (startDate && bookedCounts) {
    const startKey = new Date(startDate).toISOString().split('T')[0];
    availableSpots = Math.max(maxCapacity - (bookedCounts[startKey] || 0), 0);
  }

  const balance = availableSpots - (students || 0);
  const lessonPrice = regularPrice - discount;
  const totalPrice = students * lessonPrice;
  const bookingData = {
    startDate,
    endDate,
    lessonPrice,
    lessonId: id,
    totalPrice,
  };
  const createBookingWithData = createBooking.bind(null, bookingData);

  return (
    /* h-full and flex-col allow the container to stretch vertically */
    <div ref={formRef} className="w-full h-full flex flex-col scroll-mt-20">
      <div className="bg-logo-10 px-4 py-3 flex items-center justify-between rounded-t-xl border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image
              src={user?.image || '/default-avatar.jpg'}
              alt={user?.name}
              fill
              className="rounded-full object-cover"
            />
          </div>
          <span className="font-semibold text-primary-900 text-sm md:text-base">
            Booking as {user?.name.split(' ')[0]}
          </span>
        </div>
        <UsersIcon className="h-5 w-5 text-primary-700 opacity-50" />
      </div>

      <form
        action={async (formData) => {
          if (!user) return;
          await createBookingWithData(formData);
          resetRange();
        }}
        /* flex-grow here ensures the primary-500 background fills the column */
        className="bg-primary-500 p-5 md:p-10 flex flex-col gap-5 flex-grow rounded-b-xl text-white"
      >
        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wide">
            Number of Students
          </label>
          <select
            name="numStudents"
            className="w-full px-4 py-3 bg-white text-primary-800 rounded-lg text-base focus:ring-4 focus:ring-logo-100/20 outline-none"
            value={students}
            onChange={(e) => setStudents(Number(e.target.value))}
            required
          >
            <option value="">Select students...</option>
            {Array.from({ length: availableSpots }, (_, i) => i + 1).map(
              (x) => (
                <option value={x} key={x}>
                  {x} {x === 1 ? 'Student' : 'Students'}
                </option>
              )
            )}
          </select>
        </div>

        <div className="p-4 bg-white/10 rounded-lg border border-white/10">
          <p className="text-xs uppercase font-bold opacity-70 mb-1">
            Capacity Check
          </p>
          <p className="text-sm font-medium">
            {balance >= 0
              ? `${balance} spots still available after your booking`
              : 'Waitlist only'}
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold uppercase tracking-wide">
            Financial Goals
          </label>
          <textarea
            name="observations"
            className="w-full px-4 py-3 bg-white text-primary-800 rounded-lg text-base focus:ring-4 focus:ring-logo-100/20 outline-none"
            placeholder="What are you hoping to achieve? (Home, retirement, etc.)"
            rows={3}
          />
        </div>

        {/* mt-auto pushes this button section to the bottom of the column */}
        <div className="mt-auto">
          {!isValidSelection ? (
            <div className="p-4 bg-yellow-400/20 border border-yellow-400/40 rounded-lg text-center">
              <p className="text-yellow-200 text-xs font-bold uppercase">
                Step 1: Select 6 Weeks on Calendar
              </p>
            </div>
          ) : (
            <SubmitButton pendingLabel="Processing...">
              Confirm Reservation &rarr;
            </SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}

export default ReservationForm;
