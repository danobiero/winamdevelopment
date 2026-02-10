'use client';
import { ArrowDownOnSquareStackIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Filter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeFilter = searchParams.get('category') ?? 'all';

  function handleFilter(filter) {
    const params = new URLSearchParams(searchParams);
    params.set('category', filter);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }
  return (
    <div className="flex flex-wrap justify-between items-center gap-3 mb-4 bg-gray-200 rounded-full text-sm sm:text-base">
      
      <Button
        filter="lessons"
        handleFilter={handleFilter}
        activeFilter={activeFilter}
      >Lessons</Button>

      <Button
        filter="materials"
        handleFilter={handleFilter}
        activeFilter={activeFilter}
      >Materials</Button>

      <Button
        filter="tests"
        handleFilter={handleFilter}
        activeFilter={activeFilter}
      >Tests</Button>
    </div>
  );

  function Button({ filter, handleFilter, activeFilter, children }) {
    return (
      <button
      className={`px-5 py-2 hover:bg-primary-700 ${filter == activeFilter ? 'bg-logo-10' : ''} `}
      onClick={() => handleFilter(filter)}
      >
      {children}
      <ArrowDownOnSquareStackIcon className="h-6 w-6 text-gray-600" />
    </button>
)
  }
}
