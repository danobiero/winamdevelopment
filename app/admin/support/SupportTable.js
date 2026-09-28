'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  replyToSupportTicket,
  updateSupportStatus,
  getSupportThread,
} from './actions';

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
  const [search, setSearch] = useState('');

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

  const filteredTickets = tickets.filter((ticket) => {
    const q = search.toLowerCase().trim();

    if (!q) return true;

    return (
      ticket.subject?.toLowerCase().includes(q) ||
      ticket.email?.toLowerCase().includes(q) ||
      ticket.student_email?.toLowerCase().includes(q) ||
      String(ticket.id).toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* STATUS FILTERS */}
      <div className="w-full flex overflow-x-auto pb-4 gap-2 no-scrollbar scroll-smooth">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shrink-0 border ${
              status === s
                ? 'bg-[#000033] border-[#000033] text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
            }`}
          >
            {s === 'waiting_on_student' ? 'waiting on client' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div className="w-full mb-4 relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tickets, emails, or ID..."
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#000033] focus:border-transparent transition-all"
        />

        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-4.35-4.35M16 10a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
      </div>

      {/* TABLE / CARD CONTAINER */}
      <div className="w-full space-y-4 md:space-y-0 md:bg-white md:rounded-2xl md:border md:border-slate-200 md:shadow-sm">
        {/* DESKTOP HEADER */}
        <div className="hidden md:grid grid-cols-12 bg-slate-50/50 px-6 py-4 text-xs font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-200">
          <div className="col-span-7">Ticket Details</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3 text-right">Activity</div>
        </div>

        {/* ROWS / CARDS */}
        <div className="divide-y divide-slate-200">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleOpen(ticket.id)}
                className="
w-full
bg-green-100 rounded-2xl border border-slate-200 shadow-sm p-5
md:rounded-none md:border-none md:shadow-none md:px-6 md:py-4 md:grid md:grid-cols-12 md:items-center
hover:bg-blue-50/30 transition-all cursor-pointer group
"
              >
                {/* Subject & User Info */}
                <div className="col-span-7 mb-4 md:mb-0 min-w-0">
                  <div className="flex items-center gap-3 mb-1 min-w-0">
                    <span className="text-xs font-mono font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 shrink-0">
                      #{String(ticket.id).slice(0, 6)}
                    </span>

                    <span className="text-xs font-bold text-slate-400 truncate max-w-[180px] md:max-w-[260px] lg:max-w-[340px]">
                      {ticket.student_email || ticket.email || 'System Request'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base md:text-[13px] leading-tight group-hover:text-blue-700 transition-colors break-words">
                    {ticket.subject}
                  </h3>
                </div>

                {/* Status Badge */}
                <div className="col-span-2 flex items-center md:justify-center mb-4 md:mb-0">
                  <StatusBadge status={ticket.status} />
                </div>

                {/* Date/Time */}
                <div className="col-span-3 flex justify-between items-center md:block md:text-right border-t border-slate-50 pt-3 md:pt-0 md:border-none">
                  <p className="text-xs font-black text-slate-900 uppercase">
                    {new Date(ticket.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {formatRelativeTime(ticket.created_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-20 text-center bg-white rounded-2xl border border-slate-200 border-dashed m-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {search ? 'No matching tickets.' : 'No tickets found.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* RESPONSIVE PAGINATION */}
      {pageCount > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 px-2 gap-4">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
            Page {page} of {pageCount}
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              disabled={page <= 1}
              onClick={(e) => {
                e.stopPropagation();
                changePage(page - 1);
              }}
              className="flex-1 sm:flex-none px-6 py-3 sm:py-2 text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-95 shadow-sm"
            >
              Prev
            </button>
            <button
              disabled={page >= pageCount}
              onClick={(e) => {
                e.stopPropagation();
                changePage(page + 1);
              }}
              className="flex-1 sm:flex-none px-6 py-3 sm:py-2 text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-95 shadow-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

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

function SupportViewModal({ ticket, messages = [], onClose }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(ticket.status);
  const [isPending, startTransition] = useTransition();

  const isDbResolved =
    ticket.status === 'resolved' || ticket.status === 'closed';
  const isLocalChanging = status !== ticket.status;
  const showResolvedUI = isDbResolved && !isLocalChanging;

  const handleSubmit = () => {
    if (!message.trim()) return;

    startTransition(async () => {
      await replyToSupportTicket({ supportId: ticket.id, message });
      await updateSupportStatus({ supportId: ticket.id, status });
      onClose();
    });
  };

  const handleQuickClose = () => {
    startTransition(async () => {
      await updateSupportStatus({ supportId: ticket.id, status: 'closed' });
      onClose();
    });
  };

  const priorityStyles = {
    low: 'bg-slate-100 text-slate-600',
    normal: 'bg-blue-50 text-blue-600 border border-blue-100',
    high: 'bg-amber-50 text-amber-700 border border-amber-100',
    urgent: 'bg-red-50 text-red-700 border border-red-100 animate-pulse',
  };

  const statusStyles = {
    open: 'bg-rose-50 text-rose-700',
    in_progress: 'bg-amber-50 text-amber-700',
    waiting_on_student: 'bg-indigo-50 text-indigo-700',
    resolved: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 sm:p-4">
      <div className="bg-white flex flex-col w-full max-w-2xl h-[92dvh] sm:h-auto sm:max-h-[85vh] rounded-t-[2rem] sm:rounded-3xl shadow-2xl overflow-hidden ring-1 ring-white/20">
        {/* HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-slate-400">
                #{String(ticket.id).slice(0, 8)}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-wider ${
                  priorityStyles[ticket.priority] || priorityStyles.normal
                }`}
              >
                {ticket.priority || 'normal'}
              </span>
            </div>

            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-2 uppercase break-words">
              {ticket.subject}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* THREAD CONTENT */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 sm:p-6 space-y-6 overscroll-contain">
          {/* Client Info Card */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                Client Contact
              </p>
              <p className="text-sm font-bold text-slate-900 break-words">
                {ticket.name || 'Anonymous'}
              </p>
              <p className="text-xs font-medium text-slate-500 break-all">
                {ticket.email || ticket.student_email || 'No email provided'}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                Received At
              </p>
              <p className="text-xs font-bold text-slate-700 uppercase">
                {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Original Message */}
            <div className="flex flex-col items-start max-w-[92%]">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                <p className="text-xs font-black text-blue-600 mb-2 uppercase tracking-widest border-b border-blue-50 pb-1">
                  Original Inquiry
                </p>
                <p className="text-[13px] font-medium text-slate-800 whitespace-pre-wrap leading-relaxed break-words">
                  {ticket.message}
                </p>
              </div>
            </div>

            {/* Response Thread */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[92%] ${
                  msg.sender_type === 'admin'
                    ? 'ml-auto items-end'
                    : 'items-start'
                }`}
              >
                <div
                  className={`p-4 rounded-2xl shadow-sm ${
                    msg.sender_type === 'admin'
                      ? 'bg-[#000033] text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="text-xs font-black mb-2 uppercase tracking-widest opacity-60">
                    {msg.sender_type === 'admin' ? 'Support Lead' : 'Client'}
                  </p>
                  <p className="text-[13px] font-medium whitespace-pre-wrap leading-relaxed break-words">
                    {msg.message}
                  </p>
                  <p className="text-xs mt-2 opacity-40 font-bold text-right italic">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-white shrink-0">
          {!showResolvedUI ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    Update Status:
                  </span>

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all ${
                      statusStyles[status]
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_on_student">
                      Waiting on Client
                    </option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {message.trim().length === 0 && (
                  <span className="text-xs font-black text-amber-600 animate-pulse uppercase tracking-widest">
                    Message Required
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Draft your response..."
                  className="w-full border border-slate-200 rounded-2xl p-4 pr-14 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none text-sm font-medium"
                />

                <button
                  onClick={handleSubmit}
                  disabled={isPending || !message.trim()}
                  className="absolute bottom-3 right-3 w-10 h-10 flex items-center justify-center bg-[#000033] text-white rounded-xl hover:bg-blue-700 disabled:opacity-20 transition-all shadow-lg active:scale-90"
                >
                  {isPending ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    '➤'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                This ticket is {ticket.status}
              </p>

              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={() => setStatus('in_progress')}
                  className="px-6 py-2.5 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-md transition-all active:scale-95"
                >
                  Reopen & Reply
                </button>

                {ticket.status === 'resolved' && (
                  <button
                    onClick={handleQuickClose}
                    className="px-6 py-2.5 bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-300 transition-all active:scale-95"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    open: 'bg-rose-50 text-rose-700 border-rose-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    waiting_on_student: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-50 text-slate-500 border-slate-200',
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest border ${
        styles[status] || styles.closed
      }`}
    >
      {status === 'waiting_on_student' ? 'waiting on client' : status.replace(/_/g, ' ')}
    </span>
  );
}

function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#000033] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-900">
          Retrieving Thread...
        </span>
      </div>
    </div>
  );
}

function formatRelativeTime(date) {
  const diff = new Date() - new Date(date);
  const hours = Math.floor(diff / 3600000);

  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
