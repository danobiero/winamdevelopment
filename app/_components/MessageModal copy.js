'use client';

export default function MessageModal({ message, type = 'info', onClose }) {
  if (!message) return null;

  const colors = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div
        className={`max-w-md w-full rounded-xl shadow-lg p-6 ${colors[type]}`}
      >
        <p className="text-center font-medium">{message}</p>
        <div className="flex justify-center mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
