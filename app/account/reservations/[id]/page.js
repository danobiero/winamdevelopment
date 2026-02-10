import Link from 'next/link';
import { getBooking } from '@/app/_lib/data-service';
import { format, parseISO } from 'date-fns';
import PaymentButton from '@/app/_components/PaymentButton';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default async function ReservationConfirmation({ params }) {
  const reservation = await getBooking(params.id);

  if (!reservation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6">
        <h1 className="text-2xl font-semibold text-red-600">
          Reservation not found
        </h1>
        <Link
          href="/account/reservations"
          className="underline text-lg text-primary-600"
        >
          Go back to your reservations →
        </Link>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(reservation.totalPrice);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8 text-center">
      {/* 1. Success Visual */}
      <div className="mb-6">
        <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto animate-in zoom-in duration-500" />
      </div>

      {/* 2. Main Heading */}
      <h1 className="text-2xl sm:text-4xl font-bold text-blue-950 mb-4 max-w-2xl">
        Reservation Confirmed!
      </h1>
      <p className="text-primary-600 text-base sm:text-lg mb-8">
        We've reserved your spot. Please complete the payment to secure your
        lessons.
      </p>

      {/* 3. Refined Details Card */}
      <div className="bg-white border border-primary-100 shadow-sm rounded-2xl overflow-hidden max-w-md w-full text-left mb-8">
        <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
          <h2 className="font-bold text-blue-950 uppercase tracking-wider text-sm">
            Booking Summary
          </h2>
        </div>

        <div className="p-6 space-y-4 text-gray-700">
          <div className="flex justify-between border-b border-gray-50 pb-2">
            <span className="text-gray-500">Students</span>
            <span className="font-semibold text-blue-950">
              {reservation.numStudents}
            </span>
          </div>

          <div className="flex flex-col gap-1 border-b border-gray-50 pb-2">
            <span className="text-gray-500 text-sm">Date Range</span>
            <span className="font-semibold text-blue-950">
              {reservation.startDate && reservation.endDate
                ? `${format(parseISO(reservation.startDate), 'MMM dd')} — ${format(parseISO(reservation.endDate), 'MMM dd, yyyy')}`
                : 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-center bg-logo-10 p-3 rounded-lg">
            <span className="font-bold text-primary-800">Total Amount</span>
            <span className="text-xl font-bold text-primary-900">
              {formattedPrice}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Primary Call to Action (Payment) */}
      <div className="w-full max-w-md space-y-6">
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl mb-4">
          <PaymentButton
            bookingId={reservation.id}
            amount={reservation.totalPrice}
          />
        </div>

        {/* 5. Secondary Links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium">
          <Link
            href="/account/reservations"
            className="text-primary-600 hover:text-blue-950 transition-colors py-2 px-4"
          >
            View all reservations
          </Link>
          <span className="hidden sm:block text-gray-300">|</span>
          <Link
            href="/"
            className="text-primary-600 hover:text-blue-950 transition-colors py-2 px-4"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
