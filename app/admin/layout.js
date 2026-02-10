import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import AdminSideNavigation from './side-navigation';
import AdminHomeFloatingButton from './AdminFloatingButton';
import { ToastProvider } from '../_lib/ToastContext';

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  return (
      <ToastProvider> 

    <div className="flex min-h-screen w-full bg-slate-50">
      {/* Sidebar: 
          - On Desktop (lg): Fixed/Sticky on the left.
          - On Mobile: Becomes a bottom bar (handled inside the component).
          */}
      <AdminSideNavigation />

      {/* Main content:
          - lg:ml-0 (Standard flex-1 behavior)
          - pb-24: Ensures mobile content isn't hidden behind the bottom navigation bar.
          - px-4: Narrower padding for mobile.
          - px-8: Wider padding for desktop.
          */}
      <main className="flex-1 w-full overflow-x-hidden px-4 py-6 sm:px-8 sm:py-10 pb-24 lg:pb-10">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      {/* Floating Home Button:
          Ensure its z-index is high enough to sit above the navigation.
          */}
      <div className="relative z-50">
        <AdminHomeFloatingButton />
      </div>
    </div>
          </ToastProvider>
  );
}
