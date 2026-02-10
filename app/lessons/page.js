import { Suspense } from 'react';
import CabinList from '../_components/CabinList';
import Filter from '../_components/Filter';
import Spinner from '../_components/Spinner';

export default function LessonsPage({ searchParams }) {
  const filter = searchParams?.category ?? 'all';

  return (
    /* Keeping your original px-4 md:px-8 lg:px-16 */
    <div className="px-4 md:px-8 lg:px-16 py-2">
      {/* Added leading-tight to ensure that if the 4xl text wraps, 
          the lines aren't too far apart */}
      <h2 className="text-4xl font-medium mb-3 leading-tight">
        Practical Lessons
      </h2>

      <p className="text-lg mb-6">
        Learn your way! Join a group class (max 10 students) or go one-on-one
        for extra focus (max 2 students).
      </p>

      {/* Added overflow-x-auto so if the filter buttons are wider 
          than a phone screen, the user can swipe them horizontally */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <Filter />
      </div>

      <Suspense fallback={<Spinner />}>
        <CabinList filter={filter} />
      </Suspense>
    </div>
  );
}
