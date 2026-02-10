'use client';

export default function BackToCalendarButton({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="px-5 py-2.5 bg-gray-800 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-black transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
    >
      <span>←</span>
      <span>Back to Calendar</span>
    </button>
  );
}
