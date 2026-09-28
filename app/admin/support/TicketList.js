'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Search } from 'lucide-react';
import Link from 'next/link';

export default function TicketList({ tickets }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  // Filter logic: Search by ID, Subject, or Student Name
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const searchStr = searchQuery.toLowerCase();
      return (
        ticket.id.toString().includes(searchStr) ||
        ticket.subject.toLowerCase().includes(searchStr) ||
        ticket.student_name.toLowerCase().includes(searchStr)
      );
    });
  }, [tickets, searchQuery]);

  // Reset pagination when searching
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
      {/* SEARCH HEADER */}
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="relative group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search tickets by ID, name, or subject..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        {/* DESKTOP TABLE */}
        <table className="hidden md:table w-full min-w-[640px]">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-[0.15em]">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-[0.15em]">
                Ticket Info
              </th>
              <th className="px-6 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-[0.15em]">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {currentTickets.length > 0 ? (
              currentTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusIndicator status={ticket.status} />
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-400 font-mono tracking-tighter">
                        #{ticket.id}
                      </span>
                      <span className="text-sm font-bold text-slate-900 truncate max-w-[200px] lg:max-w-md">
                        {ticket.subject}
                      </span>
                      <span className="text-xs font-medium text-slate-500 italic">
                        {ticket.student_name}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-transform active:scale-95"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-12 text-center">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    No tickets found
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden w-full">
        {currentTickets.length > 0 ? (
          currentTickets.map((ticket) => (
            <Link
              href={`/admin/support/${ticket.id}`}
              key={ticket.id}
              className="block p-4 active:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <StatusIndicator status={ticket.status} />
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                    #{ticket.id}
                  </span>
                </div>
                <MessageSquare size={14} className="text-slate-300" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                {ticket.subject}
              </h3>
              <p className="text-xs font-medium text-slate-500">
                {ticket.student_name}
              </p>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              No results
            </p>
          </div>
        )}
      </div>

      {/* PAGINATION FOOTER */}
      {filteredTickets.length > 0 && (
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing{' '}
                <span className="text-slate-900">{indexOfFirstTicket + 1}</span>{' '}
                to{' '}
                <span className="text-slate-900">
                  {Math.min(indexOfLastTicket, filteredTickets.length)}
                </span>{' '}
                of{' '}
                <span className="text-slate-900">{filteredTickets.length}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                Prev
              </button>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all"
              >
                Next
              </button>
            </div>
          </div>

          <div className="flex-1 flex justify-between items-center sm:hidden">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ status }) {
  const config = {
    open: { color: 'bg-amber-500', label: 'Open' },
    in_progress: { color: 'bg-blue-500', label: 'In Progress' },
    resolved: { color: 'bg-emerald-500', label: 'Resolved' },
  };

  const { color, label } = config[status] || config.open;

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="hidden lg:inline text-xs font-black uppercase text-slate-500 tracking-tighter">
        {label}
      </span>
    </div>
  );
}
