import EditBookingFormClient from '@/app/_components/EditBookingFormClient';
import {
  getBooking,
  getLesson,
  getBookedCountForEdit,
} from '@/app/_lib/data-service';

export const revalidate = 0;

export default async function Page({ params }) {
  const { bookingId } = params;
  const booking = await getBooking(bookingId);
  if (!booking) throw new Error('Booking not found');

  const lesson = await getLesson(booking.lessonId);
  if (!lesson) throw new Error('Lesson not found');

  const { totalBookedForDate,remainingSpots } = await getBookedCountForEdit(
    lesson.id,
    booking.startDate
  );

  const maxSelectableStudents =
    (booking.numStudents ?? 0) + (remainingSpots ?? 0);
    
  return (
    <div>
      <EditBookingFormClient
        booking={booking}
        lesson={lesson}
        maxSelectableStudents={maxSelectableStudents}
      />
    </div>
  );
}
