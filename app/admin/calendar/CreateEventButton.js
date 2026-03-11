'use client';

export default function CreateEventButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        flex items-center gap-2 
        px-3 py-2 
        bg-[#000033] 
        hover:bg-blue-900 
        text-white 
        rounded-lg 
        shadow-sm 
        transition-all 
        active:scale-95
      "
    >
      {/* High-contrast plus icon */}
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M12 4v16m8-8H4"
        />
      </svg>

      <span className="text-[9px] font-black uppercase tracking-[0.2em] leading-none">
        Create Event
      </span>
    </button>
  );
}

