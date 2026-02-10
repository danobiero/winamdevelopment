'use client';

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import Navigation from './Navigation';

export default function MobileMenu({ session }) {
  const [open, setOpen] = useState(false);

  return (
    /* Higher z-index to stay above the background image */
    <div className="relative z-50">
      {/* HAMBURGER BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        /* Added bg-white/80 and backdrop-blur-sm: 
           This ensures the button is visible regardless of the image colors behind it.
        */
        className="p-2 border rounded-md border-primary-300 bg-white/90 backdrop-blur-sm shadow-sm transition-all active:scale-95"
        aria-label="Toggle Menu"
      >
        {open ? (
          <XMarkIcon className="w-6 h-6 text-blue-950" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-blue-950" />
        )}
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <>
          {/* OPTIONAL: Invisible backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-[-1]"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md shadow-2xl border border-gray-100 rounded-xl p-5 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
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
