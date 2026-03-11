import { getSupportTickets } from './actions';
import SupportTable from './SupportTable';

export const metadata = {
  title: 'Admin Support Inbox',
};

export default async function SupportPage({ searchParams }) {
  // Handle SearchParams (Next.js 15 requires awaiting this if it's a dynamic route)
  const params = await searchParams;
  const status = params?.status || 'all';
  const page = parseInt(params?.page || '1');

  // Fetch data with fallbacks
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
          <div className="bg-white rounded-[2rem] border border-dashed border-slate-300 py-24 text-center">
            <div className="mb-4 text-slate-300 flex justify-center">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Inbox Zero!</h3>
            <p className="text-slate-500 mt-2">
              All student requests for this filter have been handled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
