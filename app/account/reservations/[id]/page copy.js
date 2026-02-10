import Link from 'next/link';
import { getBooking } from '@/app/_lib/data-service';
import { format, parseISO } from 'date-fns';
import PaymentButton from '@/app/_components/PaymentButton';


export default async function ReservationConfirmation({ params }) {
  const reservation = await getBooking(params.id);
  //console.log(reservation);
  // fallback in case reservation is missing
  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <h1 className="text-2xl font-semibold text-red-600">
          Reservation not found
        </h1>
        <Link
          href="/account/reservations"
          className="underline text-lg text-accent-500"
        >
          Go back to your reservations →
        </Link>
      </div>
    );
  }

  // Format price
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(reservation.totalPrice);


  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 text-center space-y-8">
      {/* Header */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-primary-800">
        Thank you for reserving your premium lessons!
      </h1>

      {/* Reservation Card */}
      <div className="bg-white shadow-md rounded-xl p-6 sm:p-8 max-w-lg w-full text-left space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary-700">
          Reservation Details
        </h2>
        <div className="space-y-2 text-gray-700 text-base sm:text-lg">
          <p>
            <span className="font-medium">Students:</span>{' '}
            {reservation.numStudents ?? 'None'}
          </p>
          <p>
            <span className="font-medium">Date Range:</span>{' '}
            {reservation.startDate && reservation.endDate
              ? `${format(parseISO(reservation.startDate), 'MMM dd, yyyy')} → ${format(parseISO(reservation.endDate), 'MMM dd, yyyy')}`
              : 'N/A'}
          </p>
          {reservation.observations && (
            <p>
              <span className="font-medium">Notes:</span>{' '}
              {reservation.observations}
            </p>
          )}
          <p>
            <span className="font-medium">Reservation ID:</span>{' '}
            {reservation.id}
          </p>
          <p>
            <span className="font-medium">Total Price: </span> 
            {formattedPrice}
          </p>
        </div>
      </div>

      {/* Action Links */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <Link
          href="/account/reservations"
          className="underline text-lg sm:text-xl text-primary-600 hover:text-accent-600 transition-colors"
        >
          Manage your reservations →
        </Link>

        <Link
          href="/"
          className="underline text-lg sm:text-xl text-primary-600 hover:text-primary-800 transition-colors"
        >
          Back to home
        </Link>
      </div>
      <div className="pt-6 flex justify-center">
        {/* Always show Pay Now button because booking is unpaid initially */}
        <PaymentButton bookingId={reservation.id} amount={reservation.totalPrice}/>
      </div>
    </div>
  );
}
