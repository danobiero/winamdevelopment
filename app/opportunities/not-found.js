import Link from 'next/link';
import React from 'react';

export default function NotFound() {
  return (
    <main className="text-center space-y-6 mt-4 px-6">
      <h1 className="text-3xl font-semibold text-slate-900">
        This opportunity could not be found.
      </h1>

      <p className="text-slate-500">
        The investment opportunity you are looking for may have been removed or
        is no longer available.
      </p>

      <Link
        href="/opportunities"
        className="inline-block bg-logo-300 text-primary-900 px-6 py-3 rounded-full font-bold hover:bg-logo-400 transition-all"
      >
        View Opportunities
      </Link>
    </main>
  );
}
