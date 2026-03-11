import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import AdminNavigationWrapper from './_components/AdminNavigationWrapper';
import AdminHomeFloatingButton from './AdminFloatingButton';
import { ToastProvider } from '../_lib/ToastContext';

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  return (
    <ToastProvider>
      {/* 1. h-full: ensures the wrapper matches the Root Layout's screen height.
        2. overflow-hidden: prevents the entire admin area from scrolling as one piece.
      */}
      <div className="flex h-full w-full bg-slate-50 overflow-hidden">
        {/* SIDE NAV: This will now stay fixed because the parent is overflow-hidden */}
        <AdminNavigationWrapper />

        {/* MAIN CONTENT: 
          1. h-full: fills the vertical space.
          2. overflow-y-auto: ONLY this area will show a scrollbar.
        */}
        <main className="flex-1 h-full overflow-y-auto px-2 pt-0 sm:px-8 pb-24 lg:pb-10">
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
