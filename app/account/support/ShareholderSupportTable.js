'use client';

import { useState } from 'react';
import ShareholderSupportModal from './ShareholderSupportModal';

export default function ShareholderSupportTable({ tickets, messages = [] }) {
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-[0.2em] font-black">
              <th className="px-6 py-5">Subject</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="border-b border-slate-50 transition-colors group hover:bg-blue-50/40 cursor-pointer"
              >
                <td className="px-6 py-5">
                  <span className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                    {ticket.subject}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <StatusBadge status={ticket.status} />
                </td>
                <td className="px-6 py-5 text-right text-xs font-bold text-slate-400">
                  {new Date(ticket.updated_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => setSelectedTicket(ticket)}
            className="p-5 active:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start mb-3">
              <StatusBadge status={ticket.status} />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {new Date(ticket.updated_at).toLocaleDateString()}
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 leading-tight">
              {ticket.subject}
            </h4>
          </div>
        ))}
      </div>

      {selectedTicket && (
        <ShareholderSupportModal
          ticket={selectedTicket}
          messages={messages.filter((m) => m.support_id === selectedTicket.id)}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
}

/**
 * Enhanced Status Badge (Winam-ready)
 */
function StatusBadge({ status }) {
  const s = status?.toLowerCase();

  const config = {
    open: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse',
      label: 'Open',
    },
    in_progress: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
      label: 'In Progress',
    },
    waiting_on_shareholder: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
      label: 'Waiting on You',
    },
    resolved: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'Resolved',
    },
    closed: {
      bg: 'bg-slate-100',
      text: 'text-slate-500',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      label: 'Closed',
    },
  };

  const current = config[s] || config.closed;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${current.bg} ${current.text} ${current.border} shadow-sm`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${current.dot}`} />
      {current.label}
    </span>
  );
}
