import { Suspense } from 'react';
import Spinner from '../_components/Spinner';
import OngoingLessonsContainer from '../_components/OngoingLessonsContainer';
import PostLoginInstallTrigger from '../_components/PostLoginInstallTrigger';

export const metadata = {
  title: 'Account',
};

export default function AccountPage() {
  return (
    <div className="w-full">
      {/* MOBILE INSTALL MODAL TRIGGER */}
      <PostLoginInstallTrigger />

      <header className="mb-8 md:mb-12">
        {/* UPDATED HEADER BRANDING */}
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Ongoing <span className="text-blue-600">Sessions</span>
        </h1>

        <p className="text-slate-500 text-sm md:text-base font-medium mt-1">
          Information about your learning schedule
        </p>
      </header>

      <div className="min-h-[400px]">
        <Suspense fallback={<Spinner />}>
          <OngoingLessonsContainer />
        </Suspense>
      </div>
    </div>
  );
}
