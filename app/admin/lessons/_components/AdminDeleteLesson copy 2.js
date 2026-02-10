'use client';

import { useState, useTransition } from 'react';
import Toast from './Toast'; 

export default function AdminDeleteLesson({ lessonId, lessonName, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  // State to manage the toast
  const [toast, setToast] = useState(null);

  function handleConfirmDelete() {
    startTransition(async () => {
      try {
        if (typeof onDelete === 'function') {
          await onDelete(lessonId);
        }
        setConfirming(false);
        // Show success toast
        setToast({
          message: `"${lessonName}" deleted successfully!`,
          type: 'success',
        });
      } catch (err) {
        console.error(err);
        // Show error toast
        setToast({
          message: err.message || 'An unexpected error occurred.',
          type: 'error',
        });
      }
    });
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete link styled like View/Edit */}
      <button
        onClick={() => setConfirming(true)}
        className="text-red-600 hover:underline text-sm"
      >
        Delete
      </button>

      {/* Confirmation Modal */}
      {confirming && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="font-bold text-lg mb-4">Delete Lesson</h2>

            <p className="mb-6 text-sm text-gray-600">
              Are you sure you want to delete the lesson:
              <br />
              <span className="font-semibold text-gray-800">
                "{lessonName}"
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
                           rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
