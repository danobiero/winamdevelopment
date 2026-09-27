'use client';

import Link from 'next/link';

/**
 * Empty Portfolio State
 */
export default function EmptyPortfolioState({
  message = 'You have no active investments yet.',
}) {
  return (
    <div className="text-center md:text-left bg-gradient-to-br from-white to-slate-100 p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
      {/* ICON */}
      <div className="bg-green-50 p-4 rounded-2xl">
        {/* Investment / Growth Icon */}
        <svg
          className="w-12 h-12 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M3 17l6-6 4 4 7-7M14 7h7v7"
          />
        </svg>
      </div>

      {/* TEXT + CTA */}
      <div>
        <p className="text-xl font-bold text-[#000033] mb-4">{message}</p>

        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 bg-logo-100 text-white px-8 py-4 rounded-2xl font-black hover:bg-[#000033] transition-all active:scale-95 shadow-lg shadow-green-200"
        >
          Explore Investment Opportunities
          <span>&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
