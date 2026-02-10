import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link'; // Added Link import

import { getBookingById, getLesson, getBookedCountForEdit } from '../actions';

import EditBookingFormClient from './EditBookingFormClient';

export const revalidate = 0;

export default async function Page({ params }) {
  const session = await auth();
  if (!session?.user?.adminId) redirect('/admin-login');
  const adminId = session.user.adminId;

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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">
            ←
          </span>
          Back to Bookings
        </Link>
      </div>

      <EditBookingFormClient
        booking={booking}
        lesson={lesson}
        maxSelectableStudents={maxSelectableStudents}
        adminId={adminId}
      />
    </div>
  );
}
