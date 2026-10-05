import { auth } from '@/app/_lib/auth';
import { redirect } from 'next/navigation';
import { UsersIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { getShareholdersSummaryList } from './actions';
import ShareholdersClientView from './ShareholdersClientView';

export const metadata = {
  title: 'Shareholder Directory & Drill Down | Admin Console',
};

export default async function AdminShareholdersPage({ searchParams }) {
  const session = await auth();
  if (!session?.user?.adminId) {
    redirect('/admin-login');
  }

  const params = await searchParams;
  const initialSelectedId = params?.id ? Number(params.id) : null;

  const shareholders = await getShareholdersSummaryList().catch((err) => {
    console.error('Error fetching shareholders summary list:', err);
    return [];
  });

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] w-full min-w-0 mx-auto">
      {/* HEADER SECTION */}
      <header className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#000033] tracking-tight uppercase">
              Shareholder <span className="text-blue-600">Directory</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
              <UsersIcon className="h-3 w-3 text-blue-600" />
              Administration
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Comprehensive shareholder directory with 360° drill-down analysis across applications, portfolio investments, payment inflows, redemptions, and legal withdrawal forms.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-2 text-blue-900">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider block text-blue-600">
                Audited Records
              </span>
              <span className="text-xs font-black">
                {shareholders.length} Registered Shareholders
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* INTERACTIVE DIRECTORY & DRILL DOWN COMPONENT */}
      <ShareholdersClientView
        initialShareholders={shareholders}
        initialSelectedId={initialSelectedId}
      />
    </div>
  );
}
