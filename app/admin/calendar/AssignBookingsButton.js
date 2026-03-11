'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { assignBookingsToCalendar } from './actions';

export default function AssignBookingsButton({ onError }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAssign = () => {
    startTransition(async () => {
      const result = await assignBookingsToCalendar();

      if (!result.ok) {
        onError?.(result.error);
        return;
      }

      if (result.linked === 0) {
        onError?.({
          severity: 'warning',
          title: 'No bookings found',
          userMessage:
            'There were no new bookings available to link to calendar sessions.',
        });
        return;
      }

      onError?.({
        type: 'ASSIGNMENT_SUMMARY',
        title: 'Bookings Assigned',
        userMessage: `Successfully linked ${result.linked} booking(s). ${result.unassigned > 0 ? result.unassigned + ' still unassigned.' : ''}`,
        severity: 'success',
      });

      router.refresh();
    });
  };

  return (
    <button
      onClick={handleAssign}
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
      {/* Loading Spinner or Link Icon */}
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
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      )}

      <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">
        {isPending ? 'Assigning' : 'Assign'}
      </span>
    </button>
  );
}
