'use client';

import Link from 'next/link';
import { HomeIcon } from '@heroicons/react/24/solid';

export default function AdminHomeFloatingButton() {
  return (
    <Link
      href="/admin"
      aria-label="Return to Admin Home"
      className="
        fixed
        bottom-6
        right-6
        z-50
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        bg-emerald-700
        text-white
        shadow-lg
        transition-colors
        duration-200
        hover:bg-blue-600
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
        focus:ring-offset-2
      "
    >
      <HomeIcon className="h-6 w-6" />
    </Link>
  );
}
