// app/account/calendar/page.jsx
import { auth } from '@/app/_lib/auth';
import { getStudentCalendar } from '@/app/_lib/getStudentCalendar';
import LessonCalendar from '../../_components/LessonCalendar';

export default async function Page() {
  const session = await auth();
  const studentId = session?.user?.studentId;

  const eventsByDate = await getStudentCalendar(studentId);

  return <LessonCalendar eventsByDate={eventsByDate} />;
}
