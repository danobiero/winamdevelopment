'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { syncRecurringRulesToGoogle } from './actions';

export default function SyncCalendarButton({ onError }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSync = () => {
    startTransition(async () => {
      // 1. Execute the server action
      const result = await syncRecurringRulesToGoogle();

      // 2. Centralized error handling
      if (!result?.ok) {
        // This passes the normalized error object to the parent's banner
        onError?.(result.error);
        return;
      }

      // 3. Handle the "Nothing to Sync" case as a warning
      if (result.synced === 0) {
        onError?.({
          type: 'NO_OP',
          title: 'Up to date',
          userMessage: 'All events are already synced with Google Calendar.',
          severity: 'warning',
        });
        return;
      }

      // 4. Success path
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
      className="px-4 py-2 rounded bg-logo-100 text-white text-sm font-medium hover:bg-logo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isPending ? 'Syncing…' : 'Export'}
    </button>
  );
}
