import { auth } from '../_lib/auth';
import { redirect } from 'next/navigation';
import { getBookings } from '../_lib/data-service';
import { getLessonCalendar } from '../_lib/actions';
import OngoingLessonsScroller from './OngoingLessonsScroller';
import EmptyLessonState from './EmptyLessonState';

export default async function OngoingLessonsContainer() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const studentId = session.user.studentId;
  const bookings = await getBookings(studentId);
  const today = new Date();

  const ongoingPaid = bookings.filter((b) => {
    const start = new Date(b.startDate);
    const end = new Date(b.endDate);
    const cancelled =
      b.cancelled === true || b.cancelled === 'true' || b.cancelled === 1;

    return start <= today && end >= today && b.status === 'paid' && !cancelled;
  });

  if (!ongoingPaid.length) {
    return (
      <div className="flex items-center justify-center p-4 min-h-[100px]">
        
        <div>
          <EmptyLessonState />
        </div>
      </div>
    );
  }

  // Fetch calendar data for each booking
  // Using Promise.all for better performance instead of a sequential for-loop
  const lessonsWithCalendars = await Promise.all(
    ongoingPaid.map(async (lesson) => {
      const calendarEvents = await getLessonCalendar(lesson.id);
      return { ...lesson, calendarEvents };
    })
  );

  return (
    /* Wraper ensures the scroller doesn't break the mobile layout 
       w-full: takes full width
       overflow-hidden: prevents horizontal scroll on the parent
    */
    <div className="w-full px-2 sm:px-4 md:px-0 overflow-hidden">
      <OngoingLessonsScroller lessons={lessonsWithCalendars} />
    </div>
  );
}
