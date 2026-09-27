'use client';

import { useState, useTransition } from 'react';
import { syncMissingLegacyInvestments } from '@/app/_lib/actions';
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function SyncLegacyInvestmentsButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState(null);

  const handleSync = () => {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await syncMissingLegacyInvestments();
        setResult(res);
        setTimeout(() => setResult(null), 5000);
      } catch (err) {
        setResult({ error: true, message: err.message || 'Sync failed.' });
        setTimeout(() => setResult(null), 6000);
      }
    });
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleSync}
        disabled={isPending}
        title="Verify and synchronize legacy shareholder allocations with the investments table"
        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl font-bold text-xs uppercase tracking-wider shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 shrink-0"
      >
        <ArrowPathIcon
          className={`h-4 w-4 text-blue-600 ${isPending ? 'animate-spin' : ''}`}
        />
        <span>{isPending ? 'Syncing...' : 'Sync Investments'}</span>
      </button>

      {/* Floating Toast Notification */}
      {result && (
        <div
          className={`absolute top-full right-0 mt-2 z-50 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg border whitespace-nowrap flex items-center gap-2 animate-fade-in ${
            result.error
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {result.error ? (
            <ExclamationCircleIcon className="h-4 w-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircleIcon className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
