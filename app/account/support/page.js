import {
  getShareholderSupportTickets,
  getShareholderSupportThread,
} from '../../_lib/actions';
import ShareholderSupportList from './ShareholderSupportList';
import Link from 'next/link';

export const metadata = {
  title: 'Support | Investor Dashboard',
};

export default async function SupportPage() {
  const allTickets = (await getShareholderSupportTickets()) || [];

  // Fetch messages for all tickets initially so the client can toggle instantly
  let allMessages = [];
  if (allTickets.length) {
    const threads = await Promise.all(
      allTickets.map((ticket) => getShareholderSupportThread(ticket.id))
    );
    allMessages = threads.flat();
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8 md:mb-12 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Support <span className="text-blue-600 dark:text-blue-400">Requests</span>
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium">
            View and manage your support tickets and inquiries.
          </p>
        </div>

        <div>
          <Link
            href="/account/support/new"
            className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
          >
            + Create New Ticket
          </Link>
        </div>
      </div>

      {/* Main Content */}
      {allTickets.length > 0 ? (
        <ShareholderSupportList
          allTickets={allTickets}
          allMessages={allMessages}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 text-slate-400 mb-4">
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
          <h3 className="text-sm font-bold text-slate-900">No tickets yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Submit a request if you need assistance with your account or
            investments.
          </p>
        </div>
      )}
    </div>
  );
}
