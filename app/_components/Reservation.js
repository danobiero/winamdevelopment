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
  const [settings, bookedDates, bookedCounts] = await Promise.all([
    getSettings(),
    getBookedDatesByLessonId(lesson.id, lesson.maxCapacity),
    getBookedCountsByLessonId(lesson.id),
  ]);

  const session = await auth();

  return (
    <div className="flex flex-col md:grid md:grid-cols-[1.1fr_1fr] border border-primary-200 rounded-2xl overflow-hidden min-h-[500px] shadow-sm bg-white">
      {/* LEFT SIDE: Date Selection */}
      <div className="bg-white border-b md:border-b-0 md:border-r border-primary-100 flex flex-col justify-center">
        <DateSelector
          settings={settings}
          bookedDates={bookedDates}
          lesson={lesson}
          session={session}
        />
      </div>

      {/* RIGHT SIDE: Action Area */}

      {/* COLUMN 2: RIGHT SIDE (Form) */}
      <div className="bg-primary-500 flex flex-col border-t md:border-t-0 md:border-l border-primary-600">
        {session?.user ? (
          <ReservationForm
            lesson={lesson}
            user={session.user}
            bookedCounts={bookedCounts}
          />
        ) : (
          <div className="flex-grow flex items-center justify-center p-10">
            <LoginMessage />
          </div>
        )}
      </div>
    </div>
  );
}

export default Reservation;
