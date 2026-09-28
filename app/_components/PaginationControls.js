'use client';

import Link from 'next/link';

export default function PaginationControls({ page, hasNext }) {
  return (
    /* w-full ensures the flexbox stretches across the whole container */
    <div className="flex items-center justify-between w-full pt-4">
      {/* Using 'invisible' instead of 'hidden' or 'pointer-events-none' 
         ensures the "Page X" text stays perfectly centered even on Page 1.
      */}
      <Link
        href={`?page=${page - 1}`}
        className={`px-3.5 sm:px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
          page <= 1
            ? 'invisible pointer-events-none'
            : 'text-slate-600 border-slate-200 bg-white hover:border-slate-900 hover:text-slate-900 shadow-sm'
        }`}
      >
        Previous
      </Link>

      <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
        Page {page}
      </span>

      <Link
        href={`?page=${page + 1}`}
        className={`px-3.5 sm:px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
          !hasNext
            ? 'invisible pointer-events-none'
            : 'text-slate-600 border-slate-200 bg-white hover:border-slate-900 hover:text-slate-900 shadow-sm'
        }`}
      >
        Next
      </Link>
    </div>
  );
}
