'use client';

import Link from 'next/link';

export default function PaginationControls({ page, hasNext }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <Link
        href={`?page=${page - 1}`}
        className={`px-4 py-2 rounded-md border text-sm font-medium ${
          page <= 1
            ? 'pointer-events-none text-gray-400 border-gray-200'
            : 'text-gray-700 border-gray-300 hover:bg-gray-100'
        }`}
      >
        Previous
      </Link>

      <span className="text-sm text-gray-600">Page {page}</span>

      <Link
        href={`?page=${page + 1}`}
        className={`px-4 py-2 rounded-md border text-sm font-medium ${
          !hasNext
            ? 'pointer-events-none text-gray-400 border-gray-200'
            : 'text-gray-700 border-gray-300 hover:bg-gray-100'
        }`}
      >
        Next
      </Link>
    </div>
  );
}
