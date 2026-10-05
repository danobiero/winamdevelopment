import { auth } from '@/app/_lib/auth';
import { getAdmin } from '@/app/_lib/data-service';
import { redirect } from 'next/navigation';
import { CircleStackIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { getDatabaseIntegrityReport } from './actions';
import DatabaseIntegrityClient from './DatabaseIntegrityClient';

export const metadata = {
  title: 'Database & Data Reconciliation | Admin Console',
};

export default async function DatabaseAdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/admin-login');
  }

  const admin = await getAdmin(session.user.email);
  if (!admin) {
    redirect('/admin-login');
  }

  const report = await getDatabaseIntegrityReport();

  return (
    <div className="max-w-7xl mx-auto space-y-6 pt-2">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
              <CircleStackIcon className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#000033] dark:text-white tracking-tight uppercase">
              Database <span className="text-purple-600 dark:text-purple-400">Reconciliation</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium pl-9 sm:pl-0">
            Audit foreign key consistency, clear orphaned test entries, and reconcile unlinked financial transactions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-2xs">
            <ShieldCheckIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Integrity Guard
          </span>
        </div>
      </header>

      {/* Main Console Client */}
      <DatabaseIntegrityClient initialReport={report} />
    </div>
  );
}
