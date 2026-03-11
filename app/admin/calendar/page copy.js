import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getAdminCalendarData, getAdminLessons } from './actions';
import AdminCalendarPage from './AdminCalendarPage';

export default async function Page() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const accessToken = session.accessToken;
  const adminId = session.user.adminId;

  /* =======================
     LOAD DATA (SERVER)
     ======================= */
  const [events, lessons] = await Promise.all([
    getAdminCalendarData(),
    getAdminLessons(),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <AdminCalendarPage
        events={events}
        accessToken={accessToken}
        lessons={lessons}
        adminId={adminId}
      />
    </main>
  );
}
