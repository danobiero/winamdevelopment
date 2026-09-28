import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getAdminCalendarData, getAdminOpportunities } from './actions';
import AdminCalendarPage from './AdminCalendarPage';

export const metadata = {
  title: 'Admin Schedule | Control Center',
};

export default async function Page() {
  const session = await auth();

  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const accessToken = session.accessToken;
  const adminId = session.user.adminId;

  const [events, opportunities] = await Promise.all([
    getAdminCalendarData(),
    getAdminOpportunities(),
  ]);

  return (
    <div className="max-w-7xl mx-auto space-y-3 pt-6 px-4 sm:px-6">
      {/* --- PAGE HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-[#000033] tracking-tight uppercase">
            Schedule <span className="text-blue-600">&</span> Management
          </h1>
        </div>

        <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-relaxed md:text-right">
          Managing{' '}
          <span className="text-slate-900">{opportunities?.length ?? 0}</span>{' '}
          Shareholder Meetings
        </p>
      </div>

      {/* --- MAIN CALENDAR INTERFACE --- */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm border-b-4 border-b-slate-100 overflow-hidden">
        <AdminCalendarPage
          events={events}
          accessToken={accessToken}
          opportunities={opportunities}
          adminId={adminId}
        />
      </section>
      
    </div>
  );
}
