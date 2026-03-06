'use client';

export default function ConfirmModal({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'red',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmStyles = {
    red: 'bg-red-600 hover:bg-red-700',
    amber: 'bg-amber-500 hover:bg-amber-600',
    gray: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>

        <p className="text-sm text-gray-600 mb-6 whitespace-pre-line">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200"
          >
            {cancelLabel}
          </button>

          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-bold ${confirmStyles[confirmColor]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
