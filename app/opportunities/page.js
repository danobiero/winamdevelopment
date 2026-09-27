import { Suspense } from 'react';
import OpportunityList from '@/app/_components/OpportunityList';
import Filter from '@/app/_components/Filter';
import Spinner from '@/app/_components/Spinner';

export const metadata = {
  title: 'Investment Opportunities',
};

export default function OpportunitiesPage({ searchParams }) {
  const filter = searchParams?.type ?? searchParams?.category ?? 'all';

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 xl:py-5 flex-1 flex flex-col justify-between lg:h-full lg:max-h-full lg:overflow-hidden">
      {/* Header & Filter Bar */}
      <header className="w-full flex flex-col lg:grid lg:grid-cols-[1fr_auto_1fr] items-center gap-2.5 sm:gap-3 pb-2.5 sm:pb-3 xl:pb-4 border-b border-slate-200/80 shrink-0">
        {/* Left: Title */}
        <div className="text-center lg:text-left justify-self-center lg:justify-self-start">
          <h1 className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight whitespace-nowrap">
            Investment <span className="text-blue-600">Opportunities</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden xl:block">
            Curated strategic growth projects
          </p>
        </div>

        {/* Center: Winam Ecosystem */}
        <div className="flex justify-center items-center justify-self-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 xl:py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-950 font-bold text-xs xl:text-sm shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="tracking-wide whitespace-nowrap">
              Winam Ecosystem
            </span>
          </div>
        </div>

        {/* Right: Filter */}
        <div className="w-full lg:w-auto shrink-0 flex justify-center lg:justify-self-end">
          <Filter />
        </div>
      </header>

      {/* Opportunities List Container */}
      <section className="w-full flex-1 min-h-0 flex flex-col justify-center py-2 sm:py-3 xl:py-4 overflow-y-auto lg:overflow-y-auto">
        <Suspense
          key={filter}
          fallback={
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner />
              <p className="text-slate-400 animate-pulse text-xs uppercase tracking-widest">
                Loading Opportunities...
              </p>
            </div>
          }
        >
          <OpportunityList filter={filter} />
        </Suspense>
      </section>
    </div>
  );
}
