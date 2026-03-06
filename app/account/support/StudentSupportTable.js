'use client';

import { useState } from 'react';
import StudentSupportModal from './StudentSupportModal';

export default function StudentSupportTable({ tickets, messages }) {
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-semibold">Subject</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const isClosed = ticket.status === 'closed';

              return (
                <tr
                  key={ticket.id}
                  onClick={() => !isClosed && setSelectedTicket(ticket)}
                  className={`border-b border-slate-50 transition-all ${
                    isClosed
                      ? 'bg-slate-50/50 cursor-not-allowed select-none'
                      : 'hover:bg-primary-50/30 cursor-pointer group'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isClosed && (
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2-2 0 01-2-2v-5a2-2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span
                        className={`font-medium ${isClosed ? 'text-slate-400' : 'text-slate-700 group-hover:text-primary-700'}`}
                      >
                        {ticket.subject}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        isClosed
                          ? 'bg-slate-200 text-slate-500'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-slate-400">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
