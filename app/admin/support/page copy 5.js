import { getSupportTickets } from './actions';
import SupportTable from './SupportTable';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Support Inbox',
};

export default async function SupportPage({ searchParams }) {
  const params = await searchParams;
  const status = params?.status || 'all';
  const page = parseInt(params?.page || '1');

  const data = (await getSupportTickets({ status, page })) || {
    tickets: [],
    total: 0,
    page: 1,
    pageCount: 1,
  };

  return (
    <div className="min-h-screen px-3 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-6 border-b border-slate-100 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-[#000033] tracking-tight">
              Support <span className="text-blue-600">Inbox</span>
            </h1>
          </div>

          {/* Stats Card */}
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-fit">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M20 13V6a2-2 0 00-2-2H6a2-2 0 00-2 2v7m16 0v5a2-2 0 01-2 2H6a2-2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Total Tickets
              </p>
              <p className="text-lg font-black text-slate-900 leading-none">
                {data.total}
              </p>
            </div>
          </div>
        </div>

        {/* STATUS KEY LEGEND */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Status Key:
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[10px] font-bold text-slate-600">Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-slate-600">
              In Progress
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-slate-600">
              Resolved
            </span>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="relative">
        {data.tickets.length > 0 ? (
          <SupportTable
            tickets={data.tickets}
            total={data.total}
            page={data.page}
            pageCount={data.pageCount}
            status={status}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 border-b-4 border-b-slate-100 py-16 px-6 text-center relative overflow-hidden">
            {status !== 'all' && (
              <Link
                href="/admin/support?status=all&page=1"
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-900 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Link>
            )}
            <div className="mb-4 text-emerald-500 flex justify-center">
              <div className="bg-emerald-50 p-4 rounded-full">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-black text-[#000033] uppercase tracking-tight">
              Inbox Zero!
            </h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto text-[11px] font-medium leading-relaxed uppercase">
              The{' '}
              <span className="font-bold text-blue-600 underline underline-offset-4">
                {status.replace('_', ' ')}
              </span>{' '}
              queue is clear.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
