import { auth } from '@/app/_lib/auth';
import { getLegacyShareholders, getOpportunities } from '@/app/_lib/data-service';
import LegacyForm from './LegacyForm';
import LegacyTable from './LegacyTable';
import StagedLegacyModal from './StagedLegacyModal';
import SyncLegacyInvestmentsButton from './SyncLegacyInvestmentsButton';
import { UserGroupIcon } from '@heroicons/react/24/solid';

export const metadata = {
  title: 'Legacy Shareholder Registry | Admin Console',
};

export default async function LegacyPage() {
  const session = await auth();
  if (!session?.user?.adminId) {
    throw new Error('Unauthorized');
  }

  const [opportunities, legacyRecords] = await Promise.all([
    getOpportunities().catch((err) => {
      console.error('Error loading opportunities in LegacyPage:', err);
      return [];
    }),
    getLegacyShareholders().catch((err) => {
      console.error('Error loading legacy shareholders in LegacyPage:', err);
      return [];
    }),
  ]);

  const claimedCount = legacyRecords.filter((r) => r.is_claimed).length;
  const pendingCount = legacyRecords.length - claimedCount;

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 lg:px-6 max-w-[1600px] w-full min-w-0 mx-auto">
      {/* Header Section */}
      <header className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#000033] tracking-tight uppercase">
              Legacy <span className="text-blue-600">Registry</span>
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
              <UserGroupIcon className="h-3 w-3 text-blue-600" />
              Pre-Platform Onboarding
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Pre-stage shareholders who joined before platform inception. When they sign in with Google, their portfolio, payment info, and membership migrate automatically.
          </p>
        </div>

        {/* Quick Stats Pill & Staged Shareholders Modal Button */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-xs uppercase font-bold text-amber-700 block">Pending</span>
            <span className="text-sm font-black text-amber-900">{pendingCount}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-xs uppercase font-bold text-emerald-700 block">Live & Claimed</span>
            <span className="text-sm font-black text-emerald-900">{claimedCount}</span>
          </div>

          <SyncLegacyInvestmentsButton />

          {/* Modal trigger button placed next to PENDING, LIVE & CLAIMED */}
          <StagedLegacyModal
            records={legacyRecords}
            opportunities={opportunities}
          />
        </div>
      </header>

      {/* Entry Form */}
      <section className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
          Add / Update Staging Record
        </h2>
        <LegacyForm opportunities={opportunities} />
      </section>

      {/* Staged Legacy Shareholders Table */}
      <section className="space-y-3 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
            Current Staged Legacy Shareholders ({legacyRecords.length})
          </h2>
        </div>
        <LegacyTable records={legacyRecords} opportunities={opportunities} />
      </section>
    </div>
  );
}
