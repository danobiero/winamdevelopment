import { auth } from '../_lib/auth';
import { redirect } from 'next/navigation';
import { getBookings } from '../_lib/data-service';
import { getLessonCalendar } from '../_lib/actions'; // ⭐ SERVER ACTION HERE
import OngoingLessonsScroller from './OngoingLessonsScroller';

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
      <p className="text-primary-400 text-sm italic">
        You have no ongoing lessons at this time.
      </p>
    );
  }

  // ⭐ Fetch calendar data for each booking (server-side)
  const lessonsWithCalendars = [];
  for (const lesson of ongoingPaid) {
    const calendarEvents = await getLessonCalendar(lesson.id);
    lessonsWithCalendars.push({
      ...lesson,
      calendarEvents,
    });
  }

  return <OngoingLessonsScroller lessons={lessonsWithCalendars} />;
}
