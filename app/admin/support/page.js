import { getSupportTickets } from './actions';
import SupportTable from './SupportTable';

export const metadata = {
  title: 'Support',
};

export default async function SupportPage({ searchParams }) {
  // Await searchParams in Next.js 15+ if applicable,
  // otherwise keep as is for older versions.
  const status = searchParams?.status || 'all';
  const page = parseInt(searchParams?.page || '1');

  // 1. Fetch data with a try/catch or a fallback
  const data = (await getSupportTickets({ status, page })) || {
    tickets: [],
    total: 0,
    page: 1,
    pageCount: 1,
  };

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Support Inbox</h1>
          <p className="text-slate-500 mt-1">
            Manage and respond to student inquiries.
          </p>
        </div>

        {/* Simple Badge showing total count */}
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-100 self-start">
          {data.total} Total Tickets
        </div>
      </div>

      {/* 2. Defensive passing of props */}
      <SupportTable
        tickets={data?.tickets || []}
        total={data?.total || 0}
        page={data?.page || 1}
        pageCount={data?.pageCount || 1}
        status={status}
      />
    </div>
  );
}
