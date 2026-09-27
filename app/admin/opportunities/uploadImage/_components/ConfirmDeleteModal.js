'use client';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-full mb-4 mx-auto">
          <ExclamationTriangleIcon className="h-6 w-6 text-rose-600" />
        </div>

        <h3 className="text-lg font-bold text-center text-slate-900">
          Confirm Deletion
        </h3>
        <p className="text-sm text-slate-500 text-center mt-2">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-slate-700">{itemName}</span>? This
          action cannot be undone.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
