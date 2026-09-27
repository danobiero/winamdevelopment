import Link from 'next/link';

export default function ReservationConfirmation({ reservation }) {
  // reservation could be passed as props after booking
  // Example shape: { id, students, startDate, endDate, observations }
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-8">
      {/* Header */}
      <h1 className="text-3xl sm:text-4xl font-semibold text-primary-800">
        Thank you for reserving your lessons!
      </h1>

      {/* Reservation Details */}
      <div className="bg-white shadow-md rounded-xl p-6 sm:p-8 max-w-lg w-full text-left space-y-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary-700">
          Reservation Details
        </h2>
        <div className="space-y-2 text-gray-700 text-base sm:text-lg">
          <p>
            <span className="font-medium">Students:</span>{' '}
            {reservation?.students || 'N/A'}
          </p>
          <p>
            <span className="font-medium">Date Range:</span>{' '}
            {reservation?.startDate && reservation?.endDate
              ? `${reservation.startDate} → ${reservation.endDate}`
              : 'N/A'}
          </p>
          {reservation?.observations && (
            <p>
              <span className="font-medium">Notes:</span>{' '}
              {reservation.observations}
            </p>
          )}
          <p>
            <span className="font-medium">Reservation ID:</span>{' '}
            {reservation?.id || 'Pending'}
          </p>
        </div>
      </div>

      {/* CTA Links */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        <Link
          href="/account/reservations"
          className="underline text-lg sm:text-xl text-accent-500 hover:text-accent-600 transition-colors"
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
    </div>
  );
}
