'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowPathIcon, LifebuoyIcon } from '@heroicons/react/24/outline';

export default function AccountError({ error, reset }) {
  useEffect(() => {
    // Log technical error safely on client console without showing raw string in UI
    console.error('[ACCOUNT PORTAL ERROR]', error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8 min-h-[50vh]">
      <div className="max-w-md w-full bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center space-y-5">
        <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 text-blue-900 border border-blue-100/60 flex items-center justify-center">
          <ArrowPathIcon className="w-6 h-6 animate-spin-once" />
        </div>

        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Unable to Load Account Data
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            We were unable to synchronize your portfolio details at this moment.
            Your account and investments remain secure.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 py-2.5 sm:py-3 px-4 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Reload Section</span>
          </button>

          <Link
            href="/account/support"
            className="flex-1 py-2.5 sm:py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-center"
          >
            <LifebuoyIcon className="w-4 h-4" />
            <span>Get Help</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
