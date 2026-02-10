'use client';

import { TrashIcon } from '@heroicons/react/24/solid';
import { useState, useTransition } from 'react';
import RefundRequestForm from '@/app/_components/RefundRequestForm';

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

  // ✅ Detect cancel safely
  const isCancel =
    typeof buttonLabel === 'string' &&
    buttonLabel.trim().toLowerCase() === 'cancel';

  // ✅ Adjust both values if this is a full cancellation
  const adjustedStudents = isCancel ? 0 : numStudents;
  const adjustedTotal = isCancel ? 0 : newTotal;

  // ✅ Handle delete confirmation
  function handleConfirmDelete() {
    startTransition(async () => {
      try {
        if (typeof onDelete === 'function') {
          await onDelete(bookingId);
        }
        setConfirming(false);
      } catch (err) {
        console.error(err);
        alert(err.message || 'An unexpected error occurred.');
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

      {/* Conditional modal rendering */}
      {confirming && (
        <>
          {isCancel ? (
            // ✅ Pass both numStudents=0 and newTotal=0 for cancellations
            <RefundRequestForm
              bookingId={bookingId}
              refundAmount={refundAmount}
              numStudents={adjustedStudents}
              newTotal={adjustedTotal}
              oldTotal={adjustedTotal}
              onClose={() => setConfirming(false)}
            />
          ) : (
            // 🗑️ Standard delete confirmation modal
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
