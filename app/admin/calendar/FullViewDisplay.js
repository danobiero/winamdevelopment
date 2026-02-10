'use client';

import { format } from 'date-fns';

export default function FullViewDisplay({ data }) {
  if (!Array.isArray(data)) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold text-center">
        Full View Error: Invalid data format.
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 italic text-center">
        No grouped booking data available for this period.
      </div>
    );
  }

  // Consistent color mapping to match your Calendar Grid
  const lessonColors = {
    1: 'bg-blue-50 text-blue-700 border-blue-200',
    2: 'bg-green-50 text-green-700 border-green-200',
    default: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    /* Responsive Grid: 1 col on mobile, 2 on tablet, 3 on desktop */
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {data.map((row) => (
        <div
          key={row.calendar_id}
          className="flex flex-col border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          {/* Card Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              ID: {row.calendar_id}
            </span>
            {row.start_time && (
              <span className="text-sm font-bold text-gray-900">
                {format(new Date(row.start_time), 'eeee, MMM do')}
              </span>
            )}
          </div>

          {/* Booking list */}
          <div className="p-4 flex flex-col gap-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
              Confirmed Bookings ({row.bookings.length})
            </p>

            {row.bookings.map((b, idx) => {
              const colorClass =
                lessonColors[b.lesson_id] || lessonColors.default;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs font-medium ${colorClass}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold">
                      #{b.booking_id} {b.student_name}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {b.lesson_name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
