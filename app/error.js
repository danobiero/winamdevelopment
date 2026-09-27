'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Keep raw error traces strictly in the developer console
    console.error('[ROUTE ERROR LOG]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-16">
      <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 md:p-10 border border-slate-100 text-center space-y-6">
        {/* Soft Notice Icon */}
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900">
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
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Temporary Notice
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            We encountered an unexpected condition while loading this page.
            Your session remains secure.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-3 px-4 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Try Again
          </button>

          <Link
            href="/opportunities"
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 text-center flex items-center justify-center"
          >
            Explore
          </Link>
        </div>

        {/* Polite Support Link */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <Link
            href="/"
            className="hover:text-blue-600 font-medium transition-colors"
          >
            ← Home
          </Link>
          <Link
            href="/support"
            className="hover:text-blue-600 font-medium transition-colors"
          >
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  );
}
