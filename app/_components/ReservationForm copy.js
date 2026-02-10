'use client';

import Image from 'next/image';
import { useReservation } from './ReservationContext';
import { UsersIcon } from '@heroicons/react/24/solid';
import { createBooking } from '../_lib/actions';
import { differenceInCalendarWeeks } from 'date-fns';
import SubmitButton from './SubmitButton';

export const revalidate = 0;

function ReservationForm({ lesson, user, bookedCounts }) {
  const { range, resetRange, students, setStudents } = useReservation();
  const { maxCapacity, regularPrice, discount, id } = lesson;


  const totalWeeks =
    range?.from && range?.to
      ? differenceInCalendarWeeks(range.to, range.from, { weekStartsOn: 1 }) + 1
      : 0;

  const isValidSelection = totalWeeks === 6;

  // --- GET START DATE AND END DATE ---
  const startDate = range.from;
  const endDate = range.to;

 // --- CALCULATE REMAINING CAPACITY ---
 // console.log(bookedCounts)
  let availableSpots = maxCapacity;
  if (startDate && bookedCounts) {
    const startKey = new Date(startDate).toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const bookedForDate = bookedCounts[startKey] || 0;
    
    availableSpots = Math.max(maxCapacity - bookedForDate, 0);
    console.log(bookedForDate);
  }

  
  const balance = availableSpots - (students || 0);


  // --- PRICE CALCULATION ---
  const lessonPrice = (regularPrice - discount);
  const totalPrice = students * (regularPrice - discount);
  const bookingData = { startDate, endDate, lessonPrice, lessonId: id, totalPrice };
  const createBookingWithData = createBooking.bind(null, bookingData);

  return (
    <div className="scale-[1.01] w-full max-w-3xl mx-auto">
      {/* Top bar */}
      <div className="bg-logo-10 text-primary-950 px-4 sm:px-8 md:px-16 py-2 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2 text-sm sm:text-base font-medium truncate max-w-[120px] sm:max-w-none">
          <UsersIcon className="h-5 w-5 text-primary-800 flex-shrink-0" />
          <span className="truncate">{user?.name || 'Guest'}</span>
        </div>
        <p className="text-sm sm:text-base font-medium truncate max-w-[120px] sm:max-w-none"></p>

        <div className="flex gap-3 sm:gap-4 items-center">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10">
            <Image
              src={user?.image || '/default-avatar.jpg'} // fallback image
              alt={user?.name || 'User'}
              fill
              className="rounded-full object-cover"
              referrerPolicy="no-referrer"
              sizes="(max-width: 640px) 32px, 40px"
            />
          </div>
        </div>
      </div>

      {/* Form body */}
      <form
        //action={createBookingWithData}
        action={async (formData) => {
          if (!user) return; //prevent submission if no session
          await createBookingWithData(formData);
          resetRange();
        }}
        className="bg-primary-500 py-6 sm:py-10 px-4 sm:px-8 md:px-16 text-base sm:text-lg flex gap-5 flex-col rounded-b-lg text-white"
      >
        {/* Students selector */}
        <div className="space-y-2">
          <label htmlFor="numStudents" className="font-medium">
            How many students ?
          </label>
          <select
            name="numStudents"
            id="numStudents"
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-md"
            value={students}
            onChange={(e) => setStudents(Number(e.target.value))}
            disabled={availableSpots === 0}
            required
          >
            <option value="">
              {availableSpots === 0
                ? 'No spots available for this date'
                : 'Select number of students...'}
            </option>

            <option value="">Available Student Positions...</option>
            {Array.from({ length: availableSpots }, (_, i) => i + 1).map(
              (x) => (
                <option value={x} key={x}>
                  {x} {x === 1 ? 'Student' : 'Students'}
                </option>
              )
            )}
          </select>
        </div>

        {/* Balance label */}
        <div className="space-y-1 mt-2">
          <label className="font-medium text-white">Balance</label>
          <div className="px-4 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-md">
            {balance >= 0 ? balance : 0} spot{balance === 1 ? '' : 's'}{' '}
            remaining
          </div>
        </div>

        {/* Hidden input to include balance in submission */}
        <input type="hidden" name="balance" value={balance} />

        {/* Observations */}
        <div className="space-y-2">
          <label htmlFor="observations" className="font-medium">
            Anything we should know about your financial goals?
          </label>
          <textarea
            name="observations"
            id="observations"
            className="px-4 py-3 bg-primary-200 text-primary-800 w-full shadow-sm rounded-md"
            placeholder="Home purchase, Debt relief, College payment, etc..."
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4 mt-4">
          {!isValidSelection ? (
            <p className="text-yellow-200 text-sm sm:text-base text-center sm:text-left">
              Please select exactly 6 weeks on the calendar to continue.
            </p>
          ) : (
            <SubmitButton pendingLabel={'Reserving...'}>
              Reserve Now
            </SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}

export default ReservationForm;
