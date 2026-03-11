'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { publishCalendarEvents } from './actions';

export default function PublishCalendarButton({ onError }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await publishCalendarEvents();

      if (!result.ok) {
        onError?.(result.error);
        return;
      }

      if (result.published === 0) {
        onError?.({
          type: 'NO_OP',
          title: 'Nothing to publish',
          userMessage: 'There are no new calendar events to publish.',
          severity: 'warning',
        });
        return;
      }

      onError?.({
        severity: 'success',
        title: 'Publish Successful',
        userMessage: `✅ Successfully published ${result.published} events to the public calendar.`,
      });

      router.refresh();
    });
  }

  return (
    <button
      onClick={handleSave}
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
      {/* Loading Spinner or Globe Icon */}
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
            d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
          />
        </svg>
      )}

      <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">
        {isPending ? 'Publishing' : 'Publish'}
      </span>
    </button>
  );
}
