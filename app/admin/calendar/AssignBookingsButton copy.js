'use client';

import { useTransition, useState } from 'react';
import { assignBookingsToCalendar } from './actions';

export default function AssignBookingsButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const handleAssign = () => {
    startTransition(async () => {
      setMessage('');

      try {
        const result = await assignBookingsToCalendar();
        setMessage(`✅ Linked ${result.linked} bookings`);
      } catch (err) {
        setMessage(`❌ Error: ${err.message}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-start">
      <button
        onClick={handleAssign}
        disabled={isPending}
        className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 transition-all active:scale-95 whitespace-nowrap"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Assigning...
          </span>
        ) : (
          'Assign Bookings'
        )}
      </button>

      {/* Persistent message area that doesn't shift the layout */}
      {message && (
        <div className="relative">
          <p
            className={`absolute top-1 left-0 whitespace-nowrap text-[11px] font-medium ${
              message.includes('❌') ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
