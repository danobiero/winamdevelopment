import { Suspense } from 'react';
import Spinner from '../_components/Spinner';
import OngoingLessonsContainer from '../_components/OngoingLessonsContainer';
import PostLoginInstallTrigger from '../_components/PostLoginInstallTrigger';

export const metadata = {
  title: 'Account',
};

export default function AccountPage() {
  return (
    /* Increased max-w to 1600px (max-w-screen-2xl) to support multi-column grids on wide monitors */
    <div className="px-4 md:px-8 lg:px-12 py-8 md:py-14 max-w-[1600px] mx-auto">
      {/* MOBILE INSTALL MODAL TRIGGER */}
      <PostLoginInstallTrigger />

      {/* Typography Updated: 
         - font-black for a more premium look 
         - color changed to #000033 to match Praxida logo
      */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#000033] mb-12 tracking-tight leading-tight text-center md:text-left">
        Your Ongoing <span className="text-blue-600">Sessions</span>
      </h2>

      <div className="min-h-[500px]">
        <Suspense fallback={<Spinner />}>
          <OngoingLessonsContainer />
        </Suspense>
      </div>
    </div>
  );
}
