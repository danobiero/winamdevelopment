import { auth } from '@/app/_lib/auth';
import { getAdmin } from '@/app/_lib/data-service';
import { redirect } from 'next/navigation';
import { WrenchScrewdriverIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { getSystemMaintenanceConfig, getMaintenanceStatus } from '@/app/_lib/maintenance-actions';
import MaintenanceClient from './MaintenanceClient';

export const metadata = {
  title: 'System Maintenance | Control Center',
};

export default async function MaintenancePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/admin-login');
  }

  const admin = await getAdmin(session.user.email);
  if (!admin) {
    redirect('/admin-login');
  }

  const config = await getSystemMaintenanceConfig();
  const status = await getMaintenanceStatus();

  return (
    <div className="max-w-5xl mx-auto space-y-6 pt-2">
      {/* --- PAGE HEADER --- */}
      <header className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <WrenchScrewdriverIcon className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#000033] dark:text-white tracking-tight uppercase">
              System <span className="text-purple-600 dark:text-purple-400">Maintenance</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium pl-9 sm:pl-0">
            Control platform availability, schedule maintenance windows, and manage shareholder advance alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            System Control
          </span>
        </div>
      </header>

      {/* --- CLIENT FORM & PREVIEWS --- */}
      <MaintenanceClient initialConfig={config} initialStatus={status} />
    </div>
  );
}
