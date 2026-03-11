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
            - pt-0: Removed all top padding to sit flush against the Header
            - w-full: Utilizes full horizontal space
            - overflow-x-hidden: Prevents horizontal shift from background blobs
        */}
        <main className="flex-1 w-full overflow-x-hidden px-2 pt-0 sm:px-8 sm:pt-0 pb-24 lg:pb-10">
          <div className="w-full flex flex-col">{children}</div>
        </main>

        {/* Floating Home Button */}
        <div className="relative z-50">
          <AdminHomeFloatingButton />
        </div>
      </div>
    </ToastProvider>
  );
}
