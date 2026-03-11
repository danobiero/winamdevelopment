import { getSupportTickets } from './actions';
import SupportTable from './SupportTable';
import Link from 'next/link'; // Import Link for navigation

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
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Admin Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-black text-[#000033] tracking-tight">
              Support <span className="text-blue-600">Inbox</span>
            </h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
              Admin View
            </span>
          </div>
          <p className="text-slate-500 max-w-md">
            Monitor, filter, and resolve student inquiries. Keep an eye on
            response times to maintain SLAs.
          </p>
        </div>

        {/* Global Stats Card */}
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto w-full md:w-auto">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 13V6a2-2 0 00-2-2H6a2-2 0 00-2 2v7m16 0v5a2-2 0 01-2 2H6a2-2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Total Tickets
            </p>
            <p className="text-xl font-black text-slate-900 leading-none">
              {data.total}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table/Grid Area */}
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
          <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 py-20 px-6 text-center relative overflow-hidden">
            {/* The "X" / Close Button in the top right of the empty state */}
            {status !== 'all' && (
              <Link
                href="/admin/support?status=all&page=1"
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
                title="Clear Filters"
              >
                <svg
                  className="w-6 h-6"
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
                  className="w-12 h-12"
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

            <h3 className="text-2xl font-black text-[#000033]">Inbox Zero!</h3>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto text-sm">
              All student requests for the{' '}
              <span className="font-bold text-blue-600 underline decoration-2 underline-offset-4">
                {status.replace('_', ' ')}
              </span>{' '}
              queue have been handled.
            </p>

            {/* Main Action Button to return to all tickets */}
            {status !== 'all' && (
              <div className="mt-8">
                <Link
                  href="/admin/support?status=all&page=1"
                  className="inline-flex items-center px-6 py-3 bg-[#000033] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                >
                  View All Tickets
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
