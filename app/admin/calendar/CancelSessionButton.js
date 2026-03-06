'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelCalendarEvent } from './actions';
import { useToast } from '@/app/_lib/ToastContext';
import ConfirmModal from './_components/ConfirmModal';

export default function CancelSessionButton({ eventId, onError, onSuccess }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = () => {
    setConfirmOpen(false);

    startTransition(async () => {
      // 🚀 OPTIMISTIC STEP:
      // Close the modal immediately so the UI feels responsive.
      onSuccess?.();

      const result = await cancelCalendarEvent(eventId);

      if (!result.ok) {
        // ⏪ ROLLBACK/ERROR STEP:
        // Pass the normalized error to the central AdminErrorBanner.
        onError?.(result.error);
        return;
      }

      // ✅ SUCCESS STEP
      showToast('Session cancelled permanently.', 'warning');

      // Refresh data immediately to update the underlying calendar view
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="px-3 py-2 rounded-md bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? 'Cancelling…' : 'Cancel Session'}
      </button>

      <ConfirmModal
        open={confirmOpen}
        title="Cancel Session"
        message={
          'This will permanently cancel the session.\n\nThis action cannot be undone.'
        }
        confirmLabel="Cancel Session"
        confirmColor="red"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
