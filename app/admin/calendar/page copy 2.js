import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { getAdminCalendarData, getAdminLessons } from './actions';
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

  /* =======================
     LOAD DATA (SERVER)
     ======================= */
  const [events, lessons] = await Promise.all([
    getAdminCalendarData(),
    getAdminLessons(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50/30 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* --- PAGE HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#000033] tracking-tight uppercase">
              Schedule <span className="text-blue-600">&</span> Management
            </h1>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
              Managing <span className="text-slate-900">{lessons.length}</span>{' '}
              Active Lessons & Calendar Events
            </p>
          </div>

          {/* Quick Info Badge */}
          <div className="hidden sm:flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
              System Live:{' '}
              {new Date().toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* --- MAIN CALENDAR INTERFACE --- */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-b-4 border-b-slate-100">
          {/* This container now matches the SupportTable's visual weight.
              We pass the data into your Client Component.
          */}
          <AdminCalendarPage
            events={events}
            accessToken={accessToken}
            lessons={lessons}
            adminId={adminId}
          />
        </section>
      </div>
    </main>
  );
}
