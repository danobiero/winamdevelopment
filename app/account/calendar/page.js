import { auth } from '@/app/_lib/auth';
import { getInvestorCalendar } from '@/app/_lib/actions';
import ShareholderCalendar from '@/app/_components/ShareholderCalendar';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shareholder Schedule | Portfolio Calendar',
};

export default async function Page() {
  const session = await auth();
  const investorId = session?.user?.shareholderId;

  // Always fetch all meetings from the calendar table
  const eventsByDate = await getInvestorCalendar(investorId);

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* --- PAGE HEADER --- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
            Shareholder <span className="text-blue-600 dark:text-blue-400">Schedule</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Regular meetings, briefings, and live sessions for your active portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-xl font-bold shadow-2xs">
            Portfolio Calendar
          </span>
        </div>
      </header>

      {/* --- MAIN CALENDAR INTERFACE --- */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ShareholderCalendar eventsByDate={eventsByDate} />
      </div>
    </div>
  );
}
