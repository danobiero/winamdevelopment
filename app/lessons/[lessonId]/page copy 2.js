import DownloadModalButton from '@/app/_components/DownloadModalButton';
import Lesson from '@/app/_components/Lesson';
import LoginMessage from '@/app/_components/LoginMessage';
import Reservation from '@/app/_components/Reservation';
import Spinner from '@/app/_components/Spinner';
import { auth } from '@/app/_lib/auth';
import { getLesson } from '@/app/_lib/data-service';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const lesson = await getLesson(params.lessonId);
  if (!lesson || !lesson.name) return { title: 'Lesson Not Found' };
  return { title: `Lesson ${lesson.name}` };
}

export default async function Page({ params }) {
  const [lesson] = await Promise.all([getLesson(params.lessonId)]);

  if (!lesson) {
    return (
      <div className="text-center mt-20 px-4 text-xl text-red-500">
        No lessons available, try again later.
        <div className="mt-4">
          <a
            href="/lessons"
            className="text-primary-600 underline hover:text-primary-800"
          >
            Go back to all lessons
          </a>
        </div>
      </div>
    );
  }

  const { name, category } = lesson;
  const session = await auth();

  return (
    /* Change 1: added px-4 to px-8 to prevent content touching screen edges.
       Change 2: Adjusted mt-8 to md:mt-12 for better vertical rhythm.
    */
    <div className="max-w-6xl mx-auto mt-8 md:mt-12 px-4 sm:px-6 lg:px-8">
      {/* Ensure the Lesson component internal layout is also responsive (flex-col on mobile) */}
      <Lesson lesson={lesson} />

      <div className="text-center mt-10 sm:mt-16 md:mt-20">
        {/* Responsive Heading: tighter leading for multiline mobile titles */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold mb-8 md:mb-12 leading-tight">
          Reserve {name} Today
        </h2>

        {/* Change 3: Reservation components often contain calendars/pickers.
           w-full ensures it doesn't overflow on small devices.
        */}
        <div className="mb-8 w-full overflow-hidden">
          <Suspense fallback={<Spinner />}>
            <Reservation lesson={lesson} />
          </Suspense>
        </div>

        {/* Action Area */}
        <div className="flex justify-center mt-6">
          {session?.user ? (
            category === 1 ? (
              <button
                className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 transition-colors duration-300 text-white px-10 py-4 rounded-lg text-lg shadow-lg"
                aria-label="Book this lesson"
              >
                Welcome
              </button>
            ) : (
              <DownloadModalButton lessonId={lesson.id} />
            )
          ) : (
            category !== 1 && (
              <div className="w-full max-w-md mx-auto">
                <LoginMessage />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
