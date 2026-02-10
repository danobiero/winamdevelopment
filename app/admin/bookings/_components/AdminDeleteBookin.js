'use client';

import { useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminDeleteBooking({ bookingId, deleteAction }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.append('bookingId', bookingId);

    startTransition(async () => {
      const result = await deleteAction(formData);

      if (!result?.success) {
        toast.error(result?.message || 'This booking could not be deleted.');
        return;
      }

      toast.success('Booking deleted successfully');
      setOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-red-600 hover:underline text-sm"
      >
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h2 className="font-bold text-lg mb-4">Confirm Delete</h2>

            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete booking #{bookingId}?
              <br />
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
