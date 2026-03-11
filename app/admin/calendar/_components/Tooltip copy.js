'use client';

export default function Tooltip({ text, children }) {
  if (!text) return <>{children}</>;

  return (
    <div className="relative group inline-flex">
      {children}

      {/* Tooltip Wrapper */}
      <div
        className="
          absolute bottom-full mb-2 left-1/2 -translate-x-1/2
          pointer-events-none opacity-0 group-hover:opacity-100 
          transition-all duration-200 transform translate-y-1 group-hover:translate-y-0
          flex flex-col items-center z-[500]
        "
      >
        <div
          className="
            bg-[#000033] text-white 
            text-[9px] font-black uppercase tracking-[0.15em]
            px-2.5 py-1.5 rounded-md shadow-xl border border-white/10
            whitespace-nowrap
          "
        >
          {text}
        </div>

        {/* Tail / Arrow */}
        <div
          className="
            w-0 h-0 
            border-l-[5px] border-l-transparent
            border-r-[5px] border-r-transparent
            border-t-[5px] border-t-[#000033]
          "
        />
      </div>
    </div>
  );
}
