'use client';

import { useState } from 'react';
import SideNavigation from '@/app/_components/SideNavigation.js';
import { Menu } from 'lucide-react';

export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Sidebar (desktop) */}
      <div className="hidden md:block border-r border-primary-900">
        <SideNavigation />
      </div>

      {/* Sidebar (mobile - drawer) */}
      <div
        className={`fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        } md:hidden`}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={`fixed top-0 left-0 h-full w-48 bg-white shadow-lg transform transition-transform duration-300 z-50 md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SideNavigation />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between p-4 border-b md:hidden">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            className="p-2 text-primary-900"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
