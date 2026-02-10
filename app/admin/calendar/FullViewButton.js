'use client';

import { useState, useTransition } from 'react';
import { getFullViewData } from './actions';

export default function FullViewButton({ onLoad }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  const handleClick = () => {
    startTransition(async () => {
      setMessage('');
      try {
        const data = await getFullViewData();
        onLoad(data); // Pass data to parent to toggle the view
      } catch (err) {
        setMessage(`❌ ${err.message}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-start md:items-end">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-purple-700 disabled:bg-gray-400 transition-all active:scale-95 whitespace-nowrap"
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
            Loading...
          </span>
        ) : (
          'Full View'
        )}
      </button>

      {/* Error message handling that won't disrupt the header layout */}
      {message && (
        <div className="relative">
          <p className="absolute top-1 right-0 md:right-0 whitespace-nowrap text-[11px] font-medium text-red-600">
            {message}
          </p>
        </div>
      )}
    </div>
  );
}
