'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SupportViewModal from './SupportViewModal';
import { getSupportThread } from './actions';

export default function SupportTable({
  tickets = [], // Default to empty array to prevent .map errors
  total = 0,
  page = 1,
  pageCount = 1,
  status = 'all',
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const changeStatus = (newStatus) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', newStatus);
    params.set('page', '1');
    router.push(`/admin/support?${params.toString()}`);
  };

  const changePage = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/admin/support?${params.toString()}`);
  };

  const handleOpen = async (ticketId) => {
    setLoading(true);
    try {
      const thread = await getSupportThread(ticketId);
      setSelected(thread);
    } finally {
      setLoading(false);
    }
  };

  const statuses = [
    'all',
    'open',
    'in_progress',
    'waiting_on_student',
    'resolved',
    'closed',
  ];

  const statusColors = {
    open: 'bg-red-100 text-red-700',
    in_progress: 'bg-amber-100 text-amber-700',
    waiting_on_student: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  };

  return (
    <>
      {/* STATUS FILTER - Scrollable on mobile */}
      <div className="flex overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap gap-2 mb-6 no-scrollbar">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap uppercase tracking-wider transition shrink-0 ${
              status === s
                ? 'bg-primary-900 text-white shadow-md'
                : 'bg-white border border-primary-100 text-primary-600 hover:bg-primary-50'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* CONTAINER */}
      <div className="bg-white border border-primary-100 rounded-2xl shadow-sm overflow-hidden">
        {/* DESKTOP HEADER - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-12 bg-primary-50/50 px-6 py-4 text-xs font-bold uppercase text-primary-600 tracking-widest border-b border-primary-100">
          <div className="col-span-6">Subject</div>
          <div className="col-span-3 text-center">Status</div>
          <div className="col-span-3 text-right">Created</div>
        </div>

        {/* ROWS */}
        <div className="divide-y divide-primary-50">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleOpen(ticket.id)}
                className="grid grid-cols-1 md:grid-cols-12 px-6 py-4 hover:bg-primary-50/50 transition cursor-pointer gap-2 md:gap-0 items-center"
              >
                {/* Subject & ID */}
                <div className="col-span-6">
                  <span className="text-[10px] font-mono text-primary-400 block md:mb-1">
                    #{ticket.id}
                  </span>
                  <h3 className="font-bold text-primary-900 truncate">
                    {ticket.subject}
                  </h3>
                </div>

                {/* Status Badge */}
                <div className="col-span-3 md:flex md:justify-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusColors[ticket.status] || 'bg-gray-100'}`}
                  >
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Date */}
                <div className="col-span-3 md:text-right text-xs text-primary-400">
                  <span className="md:hidden font-medium text-primary-300 mr-2">
                    Received:
                  </span>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-primary-400">
              No tickets found in this category.
            </div>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {pageCount > 1 && (
        <div className="flex justify-between items-center mt-8 px-2">
          <button
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
            className="px-5 py-2 text-sm font-bold bg-white border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-white transition"
          >
            ← Previous
          </button>

          <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">
            Page {page} / {pageCount}
          </span>

          <button
            disabled={page >= pageCount}
            onClick={() => changePage(page + 1)}
            className="px-5 py-2 text-sm font-bold bg-white border border-primary-200 text-primary-700 rounded-xl hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-white transition"
          >
            Next →
          </button>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary-900/10 backdrop-blur-[2px]">
          <div className="bg-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-primary-100">
            <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
            <span className="font-bold text-primary-900">
              Fetching Thread...
            </span>
          </div>
        </div>
      )}

      {/* MODAL */}
      {selected && (
        <SupportViewModal
          ticket={selected.ticket}
          messages={selected.messages}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
