import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import AdminSideNavigation from './side-navigation';
import AdminHomeFloatingButton from './AdminFloatingButton';

export default async function AdminLayout({ children }) {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      {/* Sidebar */}
      <AdminSideNavigation />

      {/* Main content */}
      <main className="flex-1 w-full overflow-y-auto px-8 py-6">
        {children}
      </main>

      {/* Floating Home Button */}
      <AdminHomeFloatingButton />
    </div>
  );
}
