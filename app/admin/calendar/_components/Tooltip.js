'use client';

export default function Tooltip({ text, children }) {
  return (
    <div className="relative group inline-flex">
      {children}

      <div
        className="
          absolute bottom-full mb-2 left-1/2 -translate-x-1/2
          hidden group-hover:block
          bg-gray-900 text-white text-[11px] font-medium
          px-3 py-1.5 rounded-lg shadow-lg
          whitespace-nowrap z-[400]
        "
      >
        {text}
        <div
          className="
            absolute top-full left-1/2 -translate-x-1/2
            border-4 border-transparent border-t-gray-900
          "
        />
      </div>
    </div>
  );
}
