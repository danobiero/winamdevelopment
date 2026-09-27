import { cookies } from 'next/headers';
import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import AdminNavigationWrapper from './_components/AdminNavigationWrapper';
import AdminHomeFloatingButton from './AdminFloatingButton';
import { ToastProvider } from '../_lib/ToastContext';
import { ThemeProvider } from '@/app/_lib/ThemeContext';
import ThemeToggle from '@/app/_components/ThemeToggle';

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const savedTheme = cookies().get('theme')?.value || 'system';

  return (
    <ThemeProvider initialTheme={savedTheme}>
      <ToastProvider>
        <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
          {/* SIDE NAV */}
          <AdminNavigationWrapper />

          {/* MAIN CONTENT AREA WITH TOP HEADER */}
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
            {/* ADMIN HEADER */}
            <header className="flex items-center justify-between px-4 sm:px-8 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-30 transition-colors duration-200">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                  Admin Console
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle compact={false} showLabel={false} />
              </div>
            </header>

            {/* MAIN CONTENT SCROLL AREA */}
            <main className="flex-1 min-w-0 overflow-y-auto px-2 pt-3 sm:px-8 pb-24 lg:pb-10 scroll-smooth">
              <div className="w-full min-w-0 flex flex-col">{children}</div>
            </main>
          </div>

          {/* Floating Home Button */}
          <div className="relative z-50">
            <AdminHomeFloatingButton />
          </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
