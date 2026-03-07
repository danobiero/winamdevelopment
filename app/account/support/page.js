import { getStudentSupportTickets } from '../../_lib/actions';
import StudentSupportTable from './StudentSupportTable';
import Link from 'next/link';

export const metadata = {
  title: 'Support | Student Dashboard',
};

export default async function SupportPage() {
  const tickets = await getStudentSupportTickets();
  const hasTickets = tickets && tickets.length > 0;

  return (
    <div className="min-h-full px-4 py-8 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#000033] mb-12 tracking-tight leading-tight text-center md:text-left">
            Support <span className="text-blue-600">Requests</span>
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View and manage your active help tickets and inquiries.
          </p>
        </div>

        <Link
          href="/account/support/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors focus:outline-none"
        >
          Create New Ticket
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {hasTickets ? (
          <div className="overflow-x-auto">
            <StudentSupportTable tickets={tickets} />
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              {/* Corrected SVG Path below */}
              <svg
                className="w-8 h-8 text-slate-400"
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
            <h3 className="text-lg font-medium text-slate-900">
              No tickets found
            </h3>
            <p className="mt-1 text-slate-500">
              You haven't submitted any support requests yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
