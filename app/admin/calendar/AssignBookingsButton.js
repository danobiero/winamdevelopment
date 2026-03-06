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

      // 🔴 Centralized error handling
      if (!result.ok) {
        onError?.(result.error);
        return;
      }

      // ⚠️ Handle case where nothing was found to assign
      if (result.linked === 0) {
        onError?.({
          severity: 'warning',
          title: 'No bookings found',
          userMessage:
            'There were no new bookings available to link to calendar sessions.',
        });
        return;
      }

      // ✅ Trigger success message
      // Your parent's useEffect handles the 4-second timer automatically
      onError?.({
        type: 'ASSIGNMENT_SUMMARY',
        title: 'Bookings Assigned',
        userMessage: `Successfully linked ${result.linked} booking(s). ${result.unassigned > 0 ? result.unassigned + ' still unassigned.' : ''}`,
        severity: 'success',
      });

      // ✅ Refresh data immediately so the grid updates while the success message is visible
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleAssign}
      disabled={isPending}
      className="px-4 py-2 rounded bg-logo-100 text-white text-sm font-medium hover:bg-logo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isPending ? 'Assigning…' : 'Assign'}
    </button>
  );
}
