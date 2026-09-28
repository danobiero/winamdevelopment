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
  oldTotal,
  newTotal,
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isCancel =
    typeof buttonLabel === 'string' &&
    buttonLabel.trim().toLowerCase() === 'cancel';

  //const adjustedStudents = isCancel ? 0 : numStudents;
  //const adjustedTotal = isCancel ? 0 : newTotal;

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
      {/* TRIGGER BUTTON: 
         Added min-w-0 and truncate to prevent frame stretching in split windows.
      */}
      <button
        onClick={() => setConfirming(true)}
        className="group flex items-center justify-center md:justify-start gap-2 uppercase text-xs font-bold flex-grow px-3 py-2 transition-colors min-w-0"
      >
        <TrashIcon className="h-5 w-5 text-primary-600 group-hover:text-red-600 transition-colors shrink-0" />
        <span className="truncate">{isPending ? '...' : buttonLabel}</span>
      </button>

      {confirming && (
        <>
          {isCancel ? (
            <RefundRequestForm
              bookingId={bookingId}
              refundAmount={refundAmount}
              numStudents={0}
              newTotal={newTotal}
              oldTotal={oldTotal}
              onClose={() => setConfirming(false)}
            />
          ) : (
            /* MODAL: 
               Added p-4 and max-w-[90%] to ensure it fits on 320px devices.
            */
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100] p-4">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
                <h2 className="font-bold text-lg mb-2 text-blue-950">
                  Confirm Deletion
                </h2>
                <p className="mb-6 text-sm text-gray-600 leading-relaxed">
                  Are you sure you want to delete this reservation? This action
                  cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={isPending}
                    className="order-2 sm:order-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Keep Reservation
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isPending}
                    className="order-1 sm:order-2 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isPending ? (
                      <>
                        <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting
                      </>
                    ) : (
                      'Delete'
                    )}
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
