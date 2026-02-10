import { Suspense } from 'react';
import Spinner from '../_components/Spinner';
import OngoingLessonsContainer from '../_components/OngoingLessonsContainer';

export const metadata = {
  title: 'Account',
};

export default function AccountPage() {
  return (
    <div className="px-4 md:px-8 lg:px-12 py-6 md:py-10 max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-logo-100 mb-8 leading-tight text-center md:text-left">
        Your Ongoing Lessons
      </h2>

      <div className="min-h-[400px]">
        <Suspense fallback={<Spinner />}>
          <OngoingLessonsContainer />
        </Suspense>
      </div>
    </div>
  );
}
