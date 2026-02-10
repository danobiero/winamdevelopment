'use client';

import { TrashIcon } from '@heroicons/react/24/solid';
import { useState, useTransition } from 'react';
import RefundRequestForm from '@/app/_components/RefundRequestForm'; // ✅ import your form

export default function DeleteReservation({
  bookingId,
  onDelete,
  buttonLabel = 'Delete',
  refundAmount,
  numStudents,
  newTotal,
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isCancel = buttonLabel.toLowerCase() === 'cancel';

  function handleConfirmDelete() {
    startTransition(async () => {
      try {
        await onDelete(bookingId);
        setConfirming(false);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setConfirming(true)}
        className="group flex items-center gap-2 uppercase text-xs font-bold flex-grow px-3 transition-colors
          text-primary-300 hover:bg-accent-600 hover:text-primary-900"
      >
        <TrashIcon className="h-5 w-5 text-primary-600 group-hover:text-primary-800 transition-colors" />
        <span className="mt-1">{buttonLabel}</span>
      </button>

      {/* Modals */}
      {confirming && (
        <>
          {isCancel ? (
            // ✅ Show refund form instead of delete modal
            <RefundRequestForm
              bookingId={bookingId}
              refundAmount={refundAmount}
              numStudents={numStudents}
              newTotal={newTotal}
              onClose={() => setConfirming(false)}
            />
          ) : (
            // 🗑️ Default delete confirmation
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-80">
                <h2 className="font-bold text-lg mb-4">Confirm Deletion</h2>
                <p className="mb-6 text-sm text-gray-600">
                  Are you sure you want to delete this reservation? This action
                  cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
