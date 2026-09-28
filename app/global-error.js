'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Log privately on the client console without rendering raw message to UI
    console.error('[GLOBAL ERROR ENCOUNTERED]', error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans antialiased">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-6">
          {/* Warning / Error Icon */}
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600">
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Application Notice
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              We experienced an unexpected issue loading the application layout.
              Our technical team has been notified.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="flex-1 py-3 px-5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="flex-1 py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Return Home
            </button>
          </div>

          <p className="text-xs text-slate-400 font-mono pt-2 border-t border-slate-100">
            If this persists, please contact WINAM Support.
          </p>
        </div>
      </body>
    </html>
  );
}
