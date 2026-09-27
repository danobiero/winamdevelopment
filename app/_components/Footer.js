'use client'; // Required for the click toggle logic
import { useState } from 'react';
import Link from 'next/link';
import {
  InformationCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

export default function Footer() {
  const [isMinimized, setIsMinimized] = useState(true);
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#1a2332] text-slate-400 border-t border-slate-800 transition-all duration-300">
      {/* MINIMIZED SYMBOL VIEW */}
      <div
        onClick={() => setIsMinimized(!isMinimized)}
        className="flex items-center justify-between px-6 py-2 cursor-pointer hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <InformationCircleIcon className="h-4 w-4 text-[#4ade80]" />
          <span className="text-[10px] uppercase tracking-widest font-bold">
            WINAM Info
          </span>
        </div>
        {isMinimized ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </div>

      {/* FULL FOOTER CONTENT (Your Original Code) */}
      {!isMinimized && (
        <div className="w-full px-6 lg:px-16 xl:px-24 py-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex flex-col md:flex-row flex-wrap justify-between gap-6 pb-4 border-b border-slate-800/60">
            <div className="basis-full md:basis-1/3 lg:basis-2/5 space-y-2">
              <Link
                href="/"
                className="text-xl font-black tracking-tighter text-[#4ade80]"
              >
                WINAM
              </Link>
              <p className="text-[11px] leading-tight max-w-sm">
                Building wealth through collective growth.
              </p>
              <div className="h-1 w-8 bg-blue-600 rounded-full" />
            </div>

            <div className="flex flex-1 flex-wrap justify-between gap-6">
              <div className="space-y-2 min-w-[120px]">
                <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                  Explore
                </h4>
                <nav className="flex flex-col gap-1 text-[11px]">
                  <Link href="/opportunities" className="hover:text-white">
                    Opportunities
                  </Link>
                  <Link href="/about" className="hover:text-white">
                    Our Vision
                  </Link>
                </nav>
              </div>

              <div className="space-y-2 md:text-right min-w-[180px]">
                <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">
                  Get in Touch
                </h4>
                <div className="space-y-1 text-[11px]">
                  <p className="text-slate-300">
                    P.O. Box 690887, Houston, TX 77070
                  </p>
                  <a
                    href="tel:+1883665872"
                    className="text-lg font-bold text-white hover:text-blue-400"
                  >
                    (346) 298-4776
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center gap-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-medium">
              © {currentYear} WINAM.
            </p>
            <nav className="flex gap-4 text-[9px] uppercase tracking-[0.2em] font-bold">
              <Link href="/terms-of-service" className="hover:text-white">
                Terms
              </Link>
              <Link href="/privacy-policy" className="hover:text-white">
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      )}
    </footer>
  );
}
