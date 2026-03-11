'use client';

import { useState, useTransition } from 'react';
import { getFullViewData } from './actions';

export default function FullViewButton({ onLoad }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const data = await getFullViewData();
        if (data && onLoad) {
          onLoad(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    });
  };

  return (
    <div className="flex flex-col items-start md:items-end">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white transition-all bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Full View'
        )}
      </button>

      {/* Logic fixed: using standard && instead of a broken ternary */}
      {error && (
        <div className="relative h-0 w-full">
          <p className="absolute right-0 top-1 text-[10px] font-bold uppercase tracking-wider text-red-500 whitespace-nowrap">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
