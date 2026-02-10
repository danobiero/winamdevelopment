'use client';

export default function BookingModal({ booking, event, onClose }) {
  if (!booking || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-md">
        <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Booking ID:</strong> {booking.id}
          </p>
          <p>
            <strong>Student:</strong> {booking.studentName}
          </p>
          <p>
            <strong>Lesson:</strong> {booking.lessonName}
          </p>
          <p>
            <strong>Start:</strong>{' '}
            {new Date(event.start_time).toLocaleString()}
          </p>
          <p>
            <strong>End:</strong> {new Date(event.end_time).toLocaleString()}
          </p>

          {event.meet_link && (
            <p className="break-all">
              <strong>Meeting Link:</strong> {event.meet_link}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Close
          </button>

          {event.meet_link && (
            <button
              onClick={() => window.open(event.meet_link, '_blank')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
