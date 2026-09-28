'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/app/_lib/ToastContext';

export default function AdminDeleteOpportunity({
  opportunityId,
  opportunityName,
  onDelete,
}) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleConfirmDelete() {
    startTransition(async () => {
      try {
        if (typeof onDelete === 'function') {
          const result = await onDelete(opportunityId);

          // Handle potential server-side validation errors (like existing investments)
          if (result?.ok === false) {
            showToast(result.error || 'Failed to delete opportunity.', 'error');
            setConfirming(false);
            return;
          }
        }

        setConfirming(false);

        // Success: The redirect in your action usually handles the success toast
        // via ToastListener, but if you don't redirect, call it here:
        // showToast(`"${opportunityName}" deleted successfully!`, 'success');
      } catch (err) {
        console.error(err);
        // Error: Use the context to show the error toast
        showToast(err.message || 'An unexpected error occurred.', 'error');
      }
    });
  }

  return (
    <>
      {/* Delete link styled like View/Edit */}
      <button
        onClick={() => setConfirming(true)}
        className="text-red-600 font-black uppercase text-xs hover:underline"
      >
        Delete
      </button>

      {/* Confirmation Modal */}
      {confirming && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="font-bold text-lg mb-4">Delete Opportunity</h2>

            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete the opportunity:
              <br />
              <span className="font-semibold text-gray-800">
                "{opportunityName}"
              </span>
              ?
              <br />
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirming(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 
                           rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Close
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 
                           rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <span className="h-3 w-3 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    Deleting...
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
  );
}
