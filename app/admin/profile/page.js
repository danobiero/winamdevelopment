import { auth } from '@/app/_lib/auth';
import { getAdmin } from '@/app/_lib/data-service';
import { redirect } from 'next/navigation';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import ProfileGate from './ProfileGate';

export const metadata = {
  title: 'Admin Profile | Control Center',
};

export default async function Page() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/admin-login');
  }

  const admin = await getAdmin(session.user.email);

  if (!admin) {
    redirect('/admin-login');
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-2">
      {/* --- PAGE HEADER --- */}
      <header className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-[#000033] tracking-tight uppercase">
            Admin <span className="text-blue-600">Profile</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage system administrator credentials and access security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100 shadow-2xs">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-blue-600" />
            Super Administrator
          </span>
        </div>
      </header>

      {/* --- GATEWAY & FORM --- */}
      <ProfileGate admin={admin} />
    </div>
  );
}
