'use client';

export default function MessageModal({ message, type = 'info', onClose }) {
  if (!message) return null;

  const colors = {
    info: 'bg-blue-600 text-white',
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
  };

  return (
    /* Added p-6 to backdrop to ensure a minimum margin on small screens */
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-6 backdrop-blur-sm">
      <div
        /* Changed w-full to w-[90%] or max-w-sm for a tighter mobile look */
        className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 ${colors[type]}`}
      >
        <p className="text-center font-semibold text-lg leading-snug">
          {message}
        </p>

        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            /* Increased py-3 for a better mobile touch target */
            className="w-full sm:w-auto px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 active:scale-95 transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
