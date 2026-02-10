import ReservationList from '@/app/_components/ReservationList';
import { auth } from '@/app/_lib/auth';
import { getBookings } from '@/app/_lib/data-service';
import Link from 'next/link';

export const metadata = {
  title: 'Reservations',
};

export default async function Page() {
  const session = await auth();
  const bookings = await getBookings(session.user.studentId);

  return (
    <div className="md:pt-4">
      {/* Change 1: Responsive text size and alignment */}
      <h2 className="font-semibold text-xl md:text-2xl text-blue-950 mb-7 text-center md:text-left">
        Your Lessons
      </h2>

      {bookings.length === 0 ? (
        /* Change 2: Balanced empty state with better mobile spacing */
        <div className="text-center md:text-left bg-primary-100 p-8 rounded-lg">
          <p className="text-base md:text-lg text-blue-950 mb-4">
            You have no lessons reserved yet.
          </p>
          <Link
            href="/lessons"
            className="inline-block bg-logo-100 text-white px-8 py-4 rounded-lg font-semibold 
             hover:bg-logo-100/90 transition-all active:scale-95 shadow-md"
          >
            Check out our premium lessons &rarr;
          </Link>
        </div>
      ) : (
        /* Change 3: ReservationList will handle its own internal grid/stacking */
        <ReservationList bookings={bookings} />
      )}
    </div>
  );
}
