import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getAdminCalendarData } from './actions';
import AdminCalendarPage from './AdminCalendarPage';

export default async function Page() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const accessToken = session.accessToken;
  const events = await getAdminCalendarData();

  return (
    <main className="min-h-screen bg-white">
      <AdminCalendarPage events={events} accessToken={accessToken} />
    </main>
  );
}
