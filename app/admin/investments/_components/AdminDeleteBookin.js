'use client';

import { useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminDeleteInvestment({ investmentId, deleteAction }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const formData = new FormData();
    formData.append('investmentId', investmentId);

    startTransition(async () => {
      const result = await deleteAction(formData);

      if (!result?.success) {
        toast.error(result?.message || 'This investment could not be deleted.');
        return;
      }

      toast.success('Investment deleted successfully');
      setOpen(false);
    });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-red-600 hover:underline font-bold uppercase text-[10px]"
      >
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in duration-200">
            <h2 className="font-bold text-lg mb-2 text-gray-900">
              Confirm Delete
            </h2>

            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete investment #{investmentId}?
              <br />
              <span className="text-red-600 font-medium">
                This action cannot be undone.
              </span>
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="px-5 py-2.5 text-sm bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={isPending}
                className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 min-w-[100px]"
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
