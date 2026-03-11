'use client';

import { useState, useMemo } from 'react';
import StudentSupportTable from './StudentSupportTable';

export default function StudentSupportList({ allTickets, allMessages }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const displayLimit = 5;

  // 1. Filtering Logic
  const filteredTickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      const subject = ticket.subject.toLowerCase();
      const query = searchQuery.toLowerCase();
      const matchesSearch = subject.includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && ticket.status === 'open') ||
        (statusFilter === 'resolved' && ticket.status === 'resolved') ||
        (statusFilter === 'closed' && ticket.status === 'closed');

      return matchesSearch && matchesStatus;
    });
  }, [allTickets, searchQuery, statusFilter]);

  const ticketsToDisplay = isExpanded
    ? filteredTickets
    : filteredTickets.slice(0, displayLimit);
  const hasMore = filteredTickets.length > displayLimit;

  // Filter Button Configuration
  const filters = [
    { id: 'all', label: 'All', color: 'blue' },
    { id: 'open', label: 'Open', color: 'green' },
    { id: 'resolved', label: 'Resolved', color: 'blue' },
    { id: 'closed', label: 'Closed', color: 'slate' },
  ];

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Status Segmented Control */}
        <div className="flex p-1 bg-slate-100 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`flex-1 lg:flex-none px-5 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 whitespace-nowrap ${
                statusFilter === f.id
                  ? 'bg-white text-blue-600 shadow-sm scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span> 
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 border-none bg-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
          />
        </div>
      </div>

      {/* Main List Container */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden transition-all">
        {filteredTickets.length > 0 ? (
          <>
            <StudentSupportTable
              tickets={ticketsToDisplay}
              messages={allMessages}
            />

            {hasMore && (
              <div className="p-6 border-t border-slate-50 bg-slate-50/30 text-center">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-xl transition-all active:scale-95"
                >
                  {isExpanded
                    ? 'Show Less'
                    : `View All (${filteredTickets.length}) →`}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">
              No {statusFilter !== 'all' ? statusFilter : ''} tickets found
              matching your search.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="mt-3 text-blue-600 text-sm font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
