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
    <div className="w-full">
      <header className="mb-8 md:mb-12">
        {/* UPDATED HEADER BRANDING */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Your <span className="text-blue-600">Lessons</span>
        </h1>
        <p className="text-slate-500 text-sm md:text-base font-medium mt-1">
          View and manage your course
        </p>
      </header>

      {bookings.length === 0 ? (
        /* Refined Empty State: Balanced with the new Slate/Blue aesthetic */
        <div className="bg-slate-50 border border-slate-200 p-8 md:p-12 rounded-2xl text-center md:text-left shadow-sm">
          <p className="text-base md:text-lg text-slate-700 font-medium mb-6">
            You have no lessons reserved yet.
          </p>
          <Link
            href="/lessons"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest 
              hover:bg-blue-700 transition-all active:scale-95 shadow-md"
          >
            Explore Lessons &rarr;
          </Link>
        </div>
      ) : (
        <ReservationList bookings={bookings} />
      )}
    </div>
  );
}
