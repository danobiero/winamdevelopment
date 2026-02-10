import ReservationList from '@/app/_components/ReservationList';
import { auth } from '@/app/_lib/auth';
import { getBookings } from '@/app/_lib/data-service';

export const metadata = {
  title: 'Reservations',
};

export default async function Page() {
  const session = await auth();
  const bookings = await getBookings(session.user.studentId);

  return (
    <div>
      <h2 className="font-semibold text-2xl text-blue-950 mb-7">
        Your Lessons
      </h2>

      {bookings.length === 0 ? (
        <p className="text-lg">
          You have no lessons reserved yet. Check out our{' '}
          <a className="underline text-accent-500" href="/lessons">
            premium lessons &rarr;
          </a>
        </p>
      ) : (
       
        <ReservationList bookings={bookings}/>
      )}
    </div>
  );
}
