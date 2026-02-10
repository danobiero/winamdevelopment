import CabinCard from '@/app/_components/CabinCard';
import { getLessons } from '../_lib/data-service';

async function CabinList({ filter }) {
  //noStore()
  const lessons = await getLessons();
  if (!lessons.length) return null;

  let displayLessons;
  if (filter === 'all') displayLessons = lessons;
  if (filter === 'lessons')
    displayLessons = lessons.filter((lesson) => lesson.category == 1);
  if (filter === 'materials')
    displayLessons = lessons.filter((lesson) => lesson.category == 2);
  if (filter === 'tests')
    displayLessons = lessons.filter((lesson) => lesson.category == 3);

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
