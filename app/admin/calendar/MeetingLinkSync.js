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

      // 🔴 Centralized error handling
      if (!result.ok) {
        onError?.(result.error);
        return;
      }

      // ⚠️ Handle "No links found" as a warning
      if (result.synced === 0) {
        onError?.({
          severity: 'warning',
          title: 'Links up to date',
          userMessage:
            'No new Google Meet links were found for the current sessions.',
        });
        return;
      }

      // ✅ Success Path
      // This triggers the parent's success banner and auto-dismiss timer
      onError?.({
        severity: 'success',
        userMessage: `✅ Successfully pulled ${result.synced} meeting links from Google.`,
      });

      // Refresh the grid to show the new links/icons
      router.refresh();
    });
  };

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      className="px-4 py-2 rounded bg-logo-100 text-white text-sm font-medium hover:bg-logo-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isPending ? 'Syncing...' : 'Meeting Links'}
    </button>
  );
}
