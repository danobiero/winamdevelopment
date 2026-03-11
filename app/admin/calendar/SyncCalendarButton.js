'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { syncRecurringRulesToGoogle } from './actions';

export default function SyncCalendarButton({ onError }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncRecurringRulesToGoogle();

      if (!result?.ok) {
        onError?.(result.error);
        return;
      }

      if (result.synced === 0) {
        onError?.({
          type: 'NO_OP',
          title: 'Up to date',
          userMessage: 'All events are already synced with Google Calendar.',
          severity: 'warning',
        });
        return;
      }

      onError?.({
        severity: 'success',
        userMessage: `✅ Successfully exported ${result.synced} events to Google.`,
      });

      router.refresh();
    });
  };

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className="
        flex items-center gap-2 
        px-3 py-2 
        bg-white border border-slate-200 
        hover:border-slate-400 hover:bg-slate-50
        text-slate-600 
        rounded-lg shadow-sm 
        transition-all 
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
      "
    >
      {/* Loading Spinner or Google Calendar Icon */}
      {isPending ? (
        <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      ) : (
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}

      <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">
        {isPending ? 'Syncing' : 'Export'}
      </span>
    </button>
  );
}
