'use client';

import { useState } from 'react';
import StudentSupportModal from './StudentSupportModal';

export default function StudentSupportTable({ tickets, messages = [] }) {
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
                      ? 'bg-slate-50/50 cursor-not-allowed'
                      : 'hover:bg-primary-50/30 cursor-pointer'
                  }`}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`font-medium ${
                        isClosed ? 'text-slate-400' : 'text-slate-700'
                      }`}
                    >
                      {ticket.subject}
                    </span>
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
