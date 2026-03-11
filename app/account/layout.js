'use client';

import SideNavigation from '@/app/_components/SideNavigation.js';

export default function Layout({ children }) {
  return (
    /* We use flex-1 to fill the remaining space provided by the Root Layout's main area.
       We remove h-screen to avoid layout conflicts with the Root's h-dvh.
    */
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
      {/* SIDEBAR: DESKTOP ONLY */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0">
        <SideNavigation isMobile={false} />
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Internal scrolling for the account content.
            pb-24 on mobile ensures the bottom nav doesn't cover the last card.
        */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* BOTTOM NAV: MOBILE ONLY */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-50 pb-safe">
          <SideNavigation isMobile={true} />
        </div>
      </div>
    </div>
  );
}
