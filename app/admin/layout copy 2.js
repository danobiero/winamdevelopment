import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import AdminSideNavigation from './side-navigation';
import AdminHomeFloatingButton from './AdminFloatingButton';
import { ToastProvider } from '../_lib/ToastContext';
import AdminNavigationWrapper from './_components/AdminNavigationWrapper';

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen w-full bg-slate-50">
        {/* Sidebar & Bottom Nav Logic */}
        <AdminNavigationWrapper />

        {/* MAIN CONTENT AREA
            - pt-2 / sm:pt-4: Significantly reduced top margin/padding
            - w-full: Reclaims the "dead space" on large screens
            - pb-24: Keeps space for the mobile bottom bar
        */}
        <main className="flex-1 w-full overflow-x-hidden px-2 pt-0 sm:px-8 sm:pt-4 pb-24 lg:pb-10">
          <div className="w-full">{children}</div>
        </main>

        {/* Floating Home Button */}
        <div className="relative z-50">
          <AdminHomeFloatingButton />
        </div>
      </div>
    </ToastProvider>
  );
}
