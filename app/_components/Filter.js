'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function Filter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const activeFilter =
    searchParams.get('type') ?? searchParams.get('category') ?? 'all';

  function handleFilter(filter) {
    const params = new URLSearchParams(searchParams);
    params.set('type', filter);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const filters = [
    { id: 'all', label: 'All Opportunities', shortLabel: 'All' },
    { id: 'real_estate', label: 'Real Estate', shortLabel: 'Real Estate' },
    { id: 'stocks', label: 'Private Equity', shortLabel: 'Equity' },
    { id: 'ventures', label: 'Ventures', shortLabel: 'Ventures' },
  ];

  return (
    <div className="w-full lg:w-auto flex items-center justify-between gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-slate-100/90 rounded-xl sm:rounded-full border border-slate-200/60 shadow-2xs">
      {filters.map((tab) => {
        const isActive = activeFilter === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleFilter(tab.id)}
            className={`flex-1 lg:flex-initial text-center px-2.5 sm:px-3.5 xl:px-4 py-1.5 xl:py-2 rounded-lg sm:rounded-full text-xs xl:text-sm font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              isActive
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
