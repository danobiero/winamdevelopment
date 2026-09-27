import { Suspense } from 'react';
import OpportunityList from '../_components/OpportunityList';
import Filter from '../_components/Filter';
import Spinner from '../_components/Spinner';

export default function OpportunitiesPage({ searchParams }) {
  const filter = searchParams?.category ?? 'all';

  return (
    <div className="w-full px-4 md:px-12 lg:px-20 py-8 space-y-10">
      {/* Header */}
      <header className="w-full border-b border-slate-100 pb-8">
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight">
          Investment <span className="text-blue-600">Opportunities</span>
        </h2>

        <p className="text-lg md:text-xl text-slate-600 mt-4 w-full leading-relaxed">
          Explore curated opportunities in real estate, equities, and strategic
          growth projects within the{' '}
          <span className="font-semibold text-slate-900">
            Winam Development ecosystem
          </span>
          .
        </p>
      </header>

      {/* Filter */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center gap-4 py-2">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 min-w-fit">
          Filter By:
        </span>

        <div className="flex-1 overflow-hidden">
          <Filter />
        </div>
      </div>

      {/* Opportunities List */}
      <main className="w-full">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Spinner />

              <p className="text-slate-400 animate-pulse text-sm uppercase tracking-widest">
                Loading Opportunities...
              </p>
            </div>
          }
        >
          <OpportunityList filter={filter} />
        </Suspense>
      </main>
    </div>
  );
}
