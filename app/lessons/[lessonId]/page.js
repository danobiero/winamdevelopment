import DownloadModalButton from '@/app/_components/DownloadModalButton';
import Lesson from '@/app/_components/Lesson';
import LoginMessage from '@/app/_components/LoginMessage';
import Reservation from '@/app/_components/Reservation';
import Spinner from '@/app/_components/Spinner';
import { auth } from '@/app/_lib/auth';
import { getLesson } from '@/app/_lib/data-service';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic'; // always fetch fresh data

export async function generateMetadata({ params }) {
  const lesson = await getLesson(params.lessonId);
  if (!lesson || !lesson.name) return { title: 'Lesson Not Found' };
  return { title: `Lesson ${lesson.name}` };
}

export default async function Page({ params }) {
  const [lesson] = await Promise.all([getLesson(params.lessonId)]);

  if (!lesson) {
    return (
      <div className="text-center mt-20 text-xl text-red-500">
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

  const {
    id,
    name,
    maxCapacity,
    regularPrice,
    discount,
    image,
    description,
    curriculum,
    category,
  } = lesson;

  const session = await auth();

  return (
    //Display the lesson
    <div className="max-w-6xl mx-auto mt-8">
      <Lesson lesson={lesson} />

      <div className="text-center mt-4 sm:mt-6 md:mt-6">
        {/* Only show header and Reservation if category is 1 or 2 */}
        {(category === 1 ) && (
          <>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-6">
              Reserve {name} Today
            </h2>
            <div className="mb-4">
              <Suspense fallback={<Spinner />}>
                <Reservation lesson={lesson} />
              </Suspense>
            </div>
          </>
        )}

        {session?.user ? (
          category === 1 ? (
            <button
              className="bg-primary-600 hover:bg-primary-700 transition-colors duration-300 text-white px-6 py-3 rounded-lg text-lg shadow-lg"
              aria-label="Book this lesson"
            >
              Welcome
            </button>
          ) : (
            <DownloadModalButton lessonId={lesson.id} />
          )
        ) : (
          category !== 1 && <LoginMessage />
        )}
      </div>
    </div>
  );
}
