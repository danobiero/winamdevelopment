'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Or use SVG strings

export default function TicketList({ tickets }) {
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;

  // Pagination Calculations
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = tickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(tickets.length / ticketsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col h-full">
      {/* TICKET LIST CONTENT */}
      <div className="flex-1 overflow-y-auto">
        {currentTickets.map((ticket) => (
          <div key={ticket.id}>{/* Your Ticket Row Component */}</div>
        ))}
      </div>

      {/* PAGINATION FOOTER */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 flex items-center justify-between sm:px-6">
        {/* Desktop: Showing "Showing X to Y of Z" */}
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-900">
                {indexOfFirstTicket + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(indexOfLastTicket, tickets.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-900">{tickets.length}</span>{' '}
              results
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white transition-all"
            >
              Next
            </button>
          </div>
        </div>

        {/* Mobile View: Compact Icons and Page Counter */}
        <div className="flex-1 flex justify-between items-center sm:hidden">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 text-slate-600 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-30"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
