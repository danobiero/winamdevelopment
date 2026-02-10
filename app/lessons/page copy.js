import { Suspense } from 'react';
import CabinList from '../_components/CabinList';
import Filter from '../_components/Filter';
import Spinner from '../_components/Spinner';

export default function LessonsPage({ searchParams }) {
  //console.log(searchParams)
  const filter = searchParams?.category ?? 'all';

  return (
    

    <div className="px-4 md:px-8 lg:px-16 py-10">
      <h2 className="text-4xl font-medium mb-3">Practical Lessons</h2>
      <p className="text-lg mx-auto mb-6">
        Learn your way! Join a group class (max 10 students) or go one-on-one
        for extra focus (max 2 students).
      </p>

      
        <div className="mb-6">
          <Filter />
        </div>

        <Suspense fallback={<Spinner />}>
          <CabinList filter={filter} />
          {/* <ReservationReminder /> */}
        </Suspense>
    </div>
  )
}
