import React from 'react';
import DateSelector from './DateSelector';
import ReservationForm from './ReservationForm';
import {
  getBookedDatesByLessonId,
  getSettings,
  getBookedCountsByLessonId,
} from '../_lib/data-service';
import { auth } from '../_lib/auth';
import LoginMessage from './LoginMessage';

async function Reservation({ lesson }) {
  const { category } = lesson;

  // Fetching data in parallel for speed
  const [settings, bookedDates, bookedCounts] = await Promise.all([
    getSettings(),
    getBookedDatesByLessonId(lesson.id, lesson.maxCapacity),
    getBookedCountsByLessonId(lesson.id),
  ]);

  const session = await auth();

  // Logic for Lesson Category 1
  if (category === 1) {
    return (
      <div className="flex flex-col md:grid md:grid-cols-[1.2fr_1fr] border border-primary-200 rounded-2xl overflow-hidden min-h-[500px] shadow-sm bg-white">
        {/* LEFT SIDE: Date Selection (White background for clarity) */}
        <div className="flex-1 bg-white">
          <DateSelector
            settings={settings}
            bookedDates={bookedDates}
            lesson={lesson}
            session={session}
          />
        </div>

        {/* RIGHT SIDE: Action Area (Subtle contrast background) */}
        <div className="bg-primary-50 p-6 md:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-primary-100">
          {session?.user ? (
            <ReservationForm
              lesson={lesson}
              user={session.user}
              bookedCounts={bookedCounts}
            />
          ) : (
            <div className="py-10 md:py-0">
              <LoginMessage />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default Reservation;
