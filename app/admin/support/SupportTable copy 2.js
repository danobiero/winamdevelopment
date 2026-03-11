'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SupportViewModal from './SupportViewModal';
import { getSupportThread } from './actions';

export default function SupportTable({
  tickets = [],
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

  return (
    <>
      {/* STATUS FILTERS - Segmented Control Style */}
      <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar scroll-smooth">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shrink-0 border-2 ${
              status === s
                ? 'bg-[#000033] border-[#000033] text-white shadow-lg scale-105'
                : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
            }`}
          >
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* DESKTOP HEADER */}
        <div className="hidden md:grid grid-cols-12 bg-slate-50/50 px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
          <div className="col-span-7">Ticket Details</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3 text-right">Activity</div>
        </div>

        {/* ROWS */}
        <div className="divide-y divide-slate-50">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleOpen(ticket.id)}
                className="grid grid-cols-1 md:grid-cols-12 px-6 md:px-8 py-6 hover:bg-blue-50/30 transition-all cursor-pointer group items-center"
              >
                {/* Subject & User Info */}
                <div className="col-span-7 mb-3 md:mb-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      #{ticket.id}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
                      {ticket.student_email || 'System Request'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base md:text-sm group-hover:text-blue-700 transition-colors">
                    {ticket.subject}
                  </h3>
                </div>

                {/* Status Badge */}
                <div className="col-span-2 flex md:justify-center mb-4 md:mb-0">
                  <StatusBadge status={ticket.status} />
                </div>

                {/* Date/Time */}
                <div className="col-span-3 text-left md:text-right">
                  <p className="text-xs font-bold text-slate-900">
                    {new Date(ticket.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400">
                    Received {formatRelativeTime(ticket.created_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">
                No tickets found in this queue.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      {pageCount > 1 && (
        <div className="flex justify-between items-center mt-10 px-4">
          <button
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
            className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-95"
          >
            ← Prev
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
              Page {page} of {pageCount}
            </span>
          </div>

          <button
            disabled={page >= pageCount}
            onClick={() => changePage(page + 1)}
            className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-95"
          >
            Next →
          </button>
        </div>
      )}

      {/* MODAL & LOADING */}
      {loading && <LoadingOverlay />}
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

/** * Helper for Status Badges */
function StatusBadge({ status }) {
  const styles = {
    open: 'bg-rose-100 text-rose-700 border-rose-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    waiting_on_student: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-500 border-slate-200',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.closed}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

/** * Helper for Loading UI */
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
      <div className="bg-white px-8 py-6 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-900">
          Loading Thread
        </span>
      </div>
    </div>
  );
}

/** * Simple relative time formatter */
function formatRelativeTime(date) {
  const diff = new Date() - new Date(date);
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
