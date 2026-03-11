import {
  getStudentSupportTickets,
  getStudentSupportThread,
} from '../../_lib/actions';
import StudentSupportList from './StudentSupportList';
import Link from 'next/link';

export const metadata = {
  title: 'Support | Student Dashboard',
};

export default async function SupportPage() {
  const allTickets = (await getStudentSupportTickets()) || [];

  // Fetch messages for all tickets initially so the client can toggle instantly
  let allMessages = [];
  if (allTickets.length) {
    const threads = await Promise.all(
      allTickets.map((ticket) => getStudentSupportThread(ticket.id))
    );
    allMessages = threads.flat();
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#000033] tracking-tight leading-tight">
            Support <span className="text-blue-600">Requests</span>
          </h2>
          <p className="text-base text-slate-500 max-w-md mx-auto md:mx-0">
            View and manage your active help tickets and inquiries.
          </p>
        </div>

        <div className="flex justify-center md:justify-end">
          <Link
            href="/account/support/new"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-bold rounded-xl shadow-md text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95"
          >
            + Create New Ticket
          </Link>
        </div>
      </div>

      {/* Main Content */}
      {allTickets.length > 0 ? (
        <StudentSupportList allTickets={allTickets} allMessages={allMessages} />
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-400 mb-4">
            <svg
              className="w-8 h-8"
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
          <h3 className="text-lg font-bold text-slate-900">No tickets yet</h3>
          <p className="text-slate-500 mt-1">
            Submit a request if you need help with your courses.
          </p>
        </div>
      )}
    </div>
  );
}
