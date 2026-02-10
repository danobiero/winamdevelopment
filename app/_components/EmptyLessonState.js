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
    <div className="text-center md:text-left bg-primary-100 p-8 rounded-lg">
      <p className="text-base md:text-lg text-blue-950 mb-4">{message}</p>
      <Link
        href="/lessons"
        className="inline-block bg-logo-100 text-white px-8 py-4 rounded-lg font-semibold 
                   hover:bg-logo-100/90 transition-all active:scale-95 shadow-md"
      >
        Check out our premium lessons &rarr;
      </Link>
    </div>
  );
}
