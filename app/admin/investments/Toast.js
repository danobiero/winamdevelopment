'use client';

import { useEffect, useState } from 'react';

export default function Toast({ message }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Standard 3-second timer for better readability
    const timer = setTimeout(() => setShow(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    /* Responsive positioning:
       - Default (mobile): Bottom center (bottom-10)
       - Desktop (sm+): Top right (sm:top-10 sm:right-10 sm:bottom-auto sm:left-auto)
    */
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 sm:top-10 sm:right-10 sm:bottom-auto sm:left-auto sm:translate-x-0 z-[100] w-[90%] sm:w-auto animate-in fade-in slide-in-from-bottom-5 sm:slide-in-from-top-5 duration-300">
      <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl font-semibold flex items-center justify-center gap-3 border border-green-500/50 backdrop-blur-md">
        {/* Success Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>

        <span className="text-sm sm:text-base whitespace-nowrap">
          {message}
        </span>
      </div>
    </div>
  );
}
