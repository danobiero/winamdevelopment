'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { name: 'Dashboard', href: '/landAnalysis' },
  { name: 'Categories', href: '/landAnalysis/categories' },
  { name: 'Options', href: '/landAnalysis/options' },
  { name: 'Report', href: '/landAnalysis/reports' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 px-8 flex items-center justify-between h-16">
      <div className="flex gap-8 h-full">
        {links.map((link) => {
          const isActive =
            link.href === '/landAnalysis'
              ? pathname === link.href
              : pathname.startsWith(link.href);

          return (
            <Link
              key={link.name}
              href={link.href}
              // 🔥 THE FIX: Disable prefetching so it always fetches fresh data on click
              prefetch={false}
              className={`relative flex items-center text-sm font-semibold transition-all duration-200 ${
                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {link.name}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center text-xs text-gray-400 font-mono">
        FLOW-NET v1.3
      </div>
    </nav>
  );
}
