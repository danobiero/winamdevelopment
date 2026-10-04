import { cookies } from 'next/headers';
import SideNavigation from '@/app/_components/SideNavigation.js';
import { ThemeProvider } from '@/app/_lib/ThemeContext';
import { auth } from '@/app/_lib/auth';
import { getMaintenanceStatus } from '@/app/_lib/maintenance-actions';
import AccountMaintenanceView from '@/app/_components/AccountMaintenanceView';
import MaintenanceAdvanceNoticeModal from '@/app/_components/MaintenanceAdvanceNoticeModal';

export default async function Layout({ children }) {
  const session = await auth();
  const savedTheme = cookies().get('theme')?.value || 'system';
  const maintenanceStatus = await getMaintenanceStatus();

  // If system is currently under active maintenance, lock account landing and sub-views
  if (maintenanceStatus.isMaintenanceActive) {
    return (
      <ThemeProvider initialTheme={savedTheme}>
        <div className="flex-1 min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center overflow-y-auto p-4 transition-colors duration-200">
          <AccountMaintenanceView
            config={maintenanceStatus.config}
            shareholderName={session?.user?.name}
          />
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider initialTheme={savedTheme}>
      {/* 8-Hour Advance Notice Popup for Shareholders */}
      {maintenanceStatus.isAdvanceNoticeActive && (
        <MaintenanceAdvanceNoticeModal
          config={maintenanceStatus.config}
          hoursUntilStart={maintenanceStatus.hoursUntilStart}
        />
      )}

      <div className="flex-1 flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-full overflow-hidden transition-colors duration-200">
        {/* SIDEBAR: DESKTOP */}
        <aside className="hidden lg:flex flex-col w-64 lg:w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-40 h-full overflow-hidden transition-colors duration-200">
          <SideNavigation isMobile={false} />
        </aside>

        {/* MAIN VIEW */}
        <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
          {/* CONTENT */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 pb-32 lg:pb-4 scroll-smooth h-full">
            <div className="max-w-7xl mx-auto w-full min-h-full flex flex-col">{children}</div>
          </main>

          {/* MOBILE NAV */}
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-colors duration-200"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <SideNavigation isMobile={true} />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
