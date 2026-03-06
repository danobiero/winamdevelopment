'use client';

import SideNavigation from '@/app/_components/SideNavigation.js';

export default function Layout({ children }) {
  return (
    /* h-screen + overflow-hidden prevents the whole page from bouncing 
       while allowing the internal main content to scroll. */
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      {/* SIDEBAR: DESKTOP ONLY */}
      <aside className="hidden md:flex flex-col w-64 border-r border-primary-100 bg-white shrink-0">
        <SideNavigation isMobile={false} />
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Main Content Area: 
            pb-24 ensures content isn't hidden behind the fixed bottom bar on mobile.
            pb-8 is sufficient for desktop. 
        */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* BOTTOM NAV: MOBILE ONLY */}
        {/* 'pb-safe' or extra padding-bottom helps with notch-screen phones */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-primary-100 z-50 pb-safe">
          <SideNavigation isMobile={true} />
        </div>
      </div>
    </div>
  );
}
