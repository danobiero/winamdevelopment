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
        className="p-1.5 sm:p-2 border rounded-xl border-slate-200 bg-white/90 backdrop-blur-sm shadow-xs transition-all active:scale-95 cursor-pointer hover:bg-slate-50"
        aria-label="Toggle Menu"
      >
        {open ? (
          <XMarkIcon className="w-5 h-5 text-slate-900" />
        ) : (
          <Bars3Icon className="w-5 h-5 text-slate-900" />
        )}
      </button>

      {/* DROPDOWN MENU */}
      {open && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40 bg-black/10 backdrop-blur-2xs"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white/95 backdrop-blur-md shadow-xl border border-slate-200/90 rounded-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right">
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
