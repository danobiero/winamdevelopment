import { Suspense } from 'react';
import CabinList from '../_components/CabinList';
import Filter from '../_components/Filter';
import Spinner from '../_components/Spinner';

export default function LessonsPage({ searchParams }) {
  const filter = searchParams?.category ?? 'all';

  return (
    /* Uses w-full to stretch edge-to-edge and fluid padding for split-screen */
    <div className="w-full px-4 md:px-12 lg:px-20 py-8 space-y-10">
      {/* Header Section: Now stretches full width */}

      <header className="w-full border-b border-slate-100 pb-8">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          Practical <span className="text-blue-600">Lessons</span>
        </h2>

        {/* Changed max-w-3xl to w-full to allow full-width stretching */}
        <p className="text-lg md:text-xl text-slate-600 mt-4 w-full leading-relaxed">
          Learn your way! Join a group class{' '}
          <span className="font-semibold text-slate-900">
            (max 10 students)
          </span>{' '}
          or go one-on-one for extra focus{' '}
          <span className="font-semibold text-slate-900">(max 2 students)</span>
          .
        </p>
      </header>
      {/* Filter Section: Prevents shrinking and allows horizontal swipe on split-screen */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center gap-4 py-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 min-w-fit">
          Filter By:
        </span>
        <div className="flex-1 overflow-hidden">
          <Filter />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner />
              <p className="text-slate-400 animate-pulse text-sm uppercase tracking-widest">
                Loading PRAXIDA Lessons...
              </p>
            </div>
          }
        >
          <CabinList filter={filter} />
        </Suspense>
      </main>
    </div>
  );
}
