import { Suspense } from 'react';
import Spinner from '../_components/Spinner';
import OngoingLessonsContainer from '../_components/OngoingLessonsContainer';

export default function AccountPage() {
  return (
    <div className="px-4 md:px-8 lg:px-16 py-10 max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-semibold text-logo-100 mb-6">
        Your Ongoing Lessons
      </h2>

      <Suspense fallback={<Spinner />}>
        <OngoingLessonsContainer />
      </Suspense>
    </div>
  );
}
