'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { syncMissingMeetingLinks } from './actions';

export default function MeetingLinkSync({ onError }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncMissingMeetingLinks();

      if (!result.ok) {
        onError?.(result.error);
        return;
      }

      if (result.synced === 0) {
        onError?.({
          severity: 'warning',
          title: 'Links up to date',
          userMessage:
            'No new Google Meet links were found for the current sessions.',
        });
        return;
      }

      onError?.({
        severity: 'success',
        userMessage: `✅ Successfully pulled ${result.synced} meeting links from Google.`,
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
      {/* Loading Spinner or Camera/Video Icon */}
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
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}

      <span className="text-xs font-black uppercase tracking-[0.2em] leading-none">
        {isPending ? 'Syncing' : 'Meeting Links'}
      </span>
    </button>
  );
}
