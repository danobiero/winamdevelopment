'use client';

import { useToast } from '@/app/_lib/ToastContext';
import ConfirmModal from './_components/ConfirmModal';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { unpublishCalendarEvent } from './actions';

export default function UnpublishButton({ eventId, onError, onSuccess }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = () => {
    setConfirmOpen(false);

    startTransition(async () => {
      // 🚀 OPTIMISTIC STEP:
      // Close the modal immediately so the user feels the "removal"
      onSuccess?.();

      const result = await unpublishCalendarEvent(eventId);

      if (!result.ok) {
        // ⏪ ROLLBACK STEP:
        // If it fails, we pass the error back to the central AdminErrorBanner.
        // The user will see the error banner even though the modal is closed.
        onError?.(result.error);
        return;
      }

      // ✅ SUCCESS STEP
      showToast('Session unpublished and removed from calendar.', 'warning');

      // Refresh data to ensure the grid/calendar matches the DB
      router.refresh();
    });
  };

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={isPending}
        className="px-3 py-2 rounded-md bg-gray-600 text-white text-xs font-bold hover:bg-gray-700 disabled:opacity-50"
      >
        {isPending ? 'Unpublishing…' : 'Unpublish'}
      </button>

      <ConfirmModal
        open={confirmOpen}
        title="Unpublish Session"
        message={
          'This will remove the session from the calendar.\n\nYou can publish it again later.'
        }
        confirmLabel="Unpublish"
        confirmColor="gray"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
