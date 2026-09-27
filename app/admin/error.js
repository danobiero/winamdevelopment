'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    // Keep diagnostics in console
    console.error('[ADMIN CONSOLE ERROR]', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[50vh]">
      <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-5">
        <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
          <ShieldExclamationIcon className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Admin Operation Failed
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            The requested administrative dataset could not be processed at this time.
            Please verify your privileges or retry.
          </p>
          {error?.message && (
            <div className="mt-3 p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-left">
              <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-wider block">
                Diagnostics:
              </span>
              <span className="text-xs font-mono text-rose-800 break-words block mt-0.5">
                {error.message}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-2.5 sm:py-3 px-4 bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Retry Action</span>
          </button>

          <Link
            href="/admin"
            className="flex-1 py-2.5 sm:py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 text-center flex items-center justify-center"
          >
            Console Home
          </Link>
        </div>
      </div>
    </div>
  );
}
