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

      // 🔴 Centralized error handling
      if (!result.ok) {
        onError?.(result.error);
        return;
      }

      // ⚠️ Optional informational warning
      if (result.published === 0) {
        onError?.({
          type: 'NO_OP',
          title: 'Nothing to publish',
          userMessage: 'There are no new calendar events to publish.',
          severity: 'warning',
        });
        return;
      }

      // ✅ Success path
      // This triggers the parent's banner and starts the 4-second timer
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
      className="px-4 py-2 rounded bg-logo-100 text-white text-sm font-medium hover:bg-logo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isPending ? 'Publishing…' : 'Publish'}
    </button>
  );
}
