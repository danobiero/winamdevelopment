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
  const [settings, bookedDates, bookedCounts] = await Promise.all([
    getSettings(),
    getBookedDatesByLessonId(lesson.id, lesson.maxCapacity),
    getBookedCountsByLessonId(lesson.id),
  ]);

  //console.log(bookedCounts,bookedDates)
  const session = await auth();

  if (category == 1) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-primary-200 rounded-xl p-6">
        <DateSelector
          settings={settings}
          bookedDates={bookedDates}
          lesson={lesson}
          session={session}
          
        />
        {session?.user ? (
          <ReservationForm
            lesson={lesson}
            user={session.user}
            bookedCounts={bookedCounts}
          />
        ) : (
          <LoginMessage />
        )}
      </div>
    );
  }
}

export default Reservation;
