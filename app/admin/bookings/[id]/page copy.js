import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';

import {
  getBookingById,
  getLesson,
  getBookedCountForEdit,
} from '../actions';

import EditBookingFormClient from './EditBookingFormClient';

export const revalidate = 0;

export default async function Page({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');
  const adminId = session.user.adminId

  const bookingId = Number(params.id);

  // 1️⃣ Fetch booking
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error('Booking not found');

  // 2️⃣ Fetch the linked lesson
  const lesson = await getLesson(booking.lessonId);
  if (!lesson) throw new Error('Lesson not found');

  // 3️⃣ Fetch how many spots are still available for this date
  const { totalBookedForDate, remainingSpots } = await getBookedCountForEdit(
    lesson.id,
    booking.startDate
  );

  // 4️⃣ Max students allowed is the current count + what is available
  const maxSelectableStudents =
    (booking.numStudents ?? 0) + (remainingSpots ?? 0);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <EditBookingFormClient
        booking={booking}
        lesson={lesson}
        maxSelectableStudents={maxSelectableStudents}
        adminId={adminId}
      />
    </div>
  );
}
