import CabinCard from '@/app/_components/CabinCard';
import { getLessons } from '../_lib/data-service';

async function CabinList({ filter }) {
  const lessons = await getLessons();
  if (!lessons.length) return null;

  // 1️⃣ FILTER OUT DEACTIVATED LESSONS FIRST (Category 0)
  const activeLessons = lessons.filter((lesson) => lesson.category !== 0);

  // 2️⃣ APPLY USER FILTERS ON THE ACTIVE LIST
  let displayLessons;

  if (filter === 'all') {
    displayLessons = activeLessons;
  } else if (filter === 'lessons') {
    displayLessons = activeLessons.filter((lesson) => lesson.category === 1);
  } else if (filter === 'materials') {
    displayLessons = activeLessons.filter((lesson) => lesson.category === 2);
  } else if (filter === 'tests') {
    displayLessons = activeLessons.filter((lesson) => lesson.category === 3);
  } else {
    displayLessons = activeLessons;
  }

  // Handle case where a category might be empty after filtering
  if (!displayLessons.length)
    return (
      <p className="text-center text-lg">No items found for this category.</p>
    );

  return (
    <div className="max-w-7xl px-4 md:px-8 lg:px-16 mx-auto">
      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 xl:gap-14">
        {displayLessons.map((lesson) => (
          <CabinCard lesson={lesson} key={lesson.id} />
        ))}
      </div>
    </div>
  );
}


export default CabinList;
