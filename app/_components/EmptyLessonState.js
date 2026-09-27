'use client';

import Link from 'next/link';

/**
 * FLOW-NET Empty State Component
 * For use in standard .js files
 */
export default function EmptyLessonState({
  message = 'You have no lessons reserved yet.',
}) {
 return (
   <div className="text-center md:text-left bg-gradient-to-br from-white to-slate-100 p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
     <div className="bg-blue-50 p-4 rounded-2xl">
       {/* Simple Calendar Icon */}
       <svg
         className="w-12 h-12 text-blue-600"
         fill="none"
         stroke="currentColor"
         viewBox="0 0 24 24"
       >
         <path
           strokeLinecap="round"
           strokeLinejoin="round"
           strokeWidth="1.5"
           d="8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
         />
       </svg>
     </div>
     <div>
       <p className="text-xl font-bold text-[#000033] mb-4">{message}</p>
       <Link
         href="/opportunities"
         className="inline-flex items-center gap-2 bg-logo-100 text-white px-8 py-4 rounded-2xl font-black hover:bg-[#000033] transition-all active:scale-95 shadow-lg shadow-blue-200"
       >
         Explore Premium Lessons
         <span>&rarr;</span>
       </Link>
     </div>
   </div>
 );
}
