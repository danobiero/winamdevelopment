/* eslint-disable react/no-unescaped-entities */

import Link from 'next/link';
import React from 'react';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-between px-6 py-10 text-center">
      <div />

      <div className="space-y-8">
        {/* Visual Element */}
        <div className="flex justify-center">
          <div className="rounded-full bg-slate-100 p-6 dark:bg-slate-800">
            <FileQuestion className="h-12 w-12 text-slate-400" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Page not found
          </h1>

          <p className="mx-auto max-w-md text-lg text-slate-600">
            Sorry, we could not find the page you are looking for. It might have
            been moved or deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
          <Link
            href="/"
            className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all active:scale-95 hover:bg-primary-700"
          >
            Home
          </Link>

          <Link
            href="/opportunities"
            className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all active:scale-95 hover:bg-primary-700"
          >
            Opportunities
          </Link>

          <Link
            href="/account"
            className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all active:scale-95 hover:bg-primary-700"
          >
            Dashboard
          </Link>

          <Link
            href="/account/support"
            className="inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition-all active:scale-95 hover:bg-primary-700"
          >
            Support
          </Link>
        </div>
      </div>

      {/* Branding */}
      <p className="text-xs text-gray-400">Winam Development Group</p>
    </main>
  );
}
