'use client';

import { useState } from 'react';
import StudentSupportModal from './StudentSupportModal';

export default function StudentSupportTable({ tickets, messages = [] }) {
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <>
      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-5 font-bold">Subject</th>
              <th className="px-6 py-5 font-bold">Status</th>
              <th className="px-6 py-5 font-bold text-right">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const isClosed = ticket.status === 'closed';
              return (
                <tr
                  key={ticket.id}
                  onClick={() => !isClosed && setSelectedTicket(ticket)}
                  className={`border-b border-slate-50 transition-colors group ${
                    isClosed
                      ? 'bg-slate-50/50 cursor-not-allowed'
                      : 'hover:bg-blue-50/40 cursor-pointer'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`font-semibold ${isClosed ? 'text-slate-400' : 'text-slate-800'}`}
                    >
                      {ticket.subject}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-400 font-medium">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Shown only on Mobile */}
      <div className="md:hidden divide-y divide-slate-100">
        {tickets.map((ticket) => {
          const isClosed = ticket.status === 'closed';
          return (
            <div
              key={ticket.id}
              onClick={() => !isClosed && setSelectedTicket(ticket)}
              className={`p-5 active:bg-slate-50 transition-colors ${
                isClosed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <StatusBadge status={ticket.status} />
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
                  {new Date(ticket.updated_at).toLocaleDateString()}
                </span>
              </div>
              <h4
                className={`text-base font-bold leading-snug ${isClosed ? 'text-slate-500' : 'text-slate-900'}`}
              >
                {ticket.subject}
              </h4>
              {!isClosed && (
                <div className="mt-3 text-blue-600 text-xs font-bold flex items-center">
                  View Discussion
                  <svg
                    className="w-3 h-3 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedTicket && (
        <StudentSupportModal
          ticket={selectedTicket}
          messages={messages.filter((m) => m.support_id === selectedTicket.id)}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
}

/** * Reusable Badge Component to keep the code DRY
 */
function StatusBadge({ status }) {
  const isClosed = status === 'closed';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
        isClosed
          ? 'bg-slate-100 text-slate-500 border border-slate-200'
          : 'bg-green-100 text-green-700 border border-green-200'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isClosed ? 'bg-slate-400' : 'bg-green-500 animate-pulse'}`}
      />
      {status}
    </span>
  );
}
