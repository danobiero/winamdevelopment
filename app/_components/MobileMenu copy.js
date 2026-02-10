'use client';

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import Navigation from './Navigation';

export default function MobileMenu({ session }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* HAMBURGER BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 border rounded-md border-primary-300"
      >
        {open ? (
          <XMarkIcon className="w-6 h-6 text-primary-600" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-primary-600" />
        )}
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <div className="absolute right-0 mt-3 w-48 bg-white shadow-lg border border-gray-200 rounded-lg p-4 z-50 animate-slideDown">
          <Navigation session={session} isMobile />
        </div>
      )}
    </div>
  );
}
