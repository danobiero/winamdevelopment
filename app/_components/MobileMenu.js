'use client';

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import Navigation from './Navigation';

export default function MobileMenu({ session }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative z-50">
      {/* HAMBURGER BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="p-2 sm:p-2.5 border-2 rounded-xl border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm transition-all active:scale-95 cursor-pointer hover:bg-blue-100/60 hover:border-blue-700"
        aria-label="Toggle Menu"
      >
        {open ? (
          <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
        ) : (
          <Bars3Icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
        )}
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-60 sm:w-64 bg-white shadow-2xl border-2 border-blue-100 rounded-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
            <Navigation
              session={session}
              isMobile
              onClick={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
