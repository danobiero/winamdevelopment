'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  replyToSupportTicket,
  updateSupportStatus,
  getSupportThread,
} from './actions';

/**
 * MAIN TABLE COMPONENT
 */
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
      {/* STATUS FILTERS */}
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
        <div className="hidden md:grid grid-cols-12 bg-slate-50/50 px-8 py-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
          <div className="col-span-7">Ticket Details</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3 text-right">Activity</div>
        </div>

        <div className="divide-y divide-slate-50">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => handleOpen(ticket.id)}
                className="grid grid-cols-1 md:grid-cols-12 px-6 md:px-8 py-6 hover:bg-blue-50/30 transition-all cursor-pointer group items-center"
              >
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

                <div className="col-span-2 flex md:justify-center mb-4 md:mb-0">
                  <StatusBadge status={ticket.status} />
                </div>

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

      {/* RESPONSIVE PAGINATION */}
      {pageCount > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-10 px-4 gap-6">
          <div className="hidden sm:block">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Displaying Page {page} of {pageCount}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              disabled={page <= 1}
              onClick={() => changePage(page - 1)}
              className="flex items-center justify-center gap-2 px-6 py-3 sm:px-5 sm:py-2.5 text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-95 flex-1 sm:flex-none"
            >
              <span className="text-lg leading-none">←</span>
              <span className="hidden sm:inline ml-1">Prev</span>
            </button>

            <div className="sm:hidden flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-900 uppercase">
                {page} / {pageCount}
              </span>
            </div>

            <button
              disabled={page >= pageCount}
              onClick={() => changePage(page + 1)}
              className="flex items-center justify-center gap-2 px-6 py-3 sm:px-5 sm:py-2.5 text-xs font-black uppercase tracking-widest bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 disabled:opacity-20 transition-all active:scale-95 flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <span className="text-lg leading-none">→</span>
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

/**
 * MODAL COMPONENT
 */
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
    normal: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-red-100 text-red-700',
  };

  const statusStyles = {
    open: 'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-sky-100 text-sky-700',
    waiting_on_student: 'bg-purple-100 text-purple-700',
    resolved: 'bg-slate-100 text-slate-700',
    closed: 'bg-slate-800 text-white',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white flex flex-col w-full max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start shrink-0 bg-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400">
                #{ticket.id}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityStyles[ticket.priority]}`}
              >
                {ticket.priority}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 line-clamp-1">
              {ticket.subject}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
          >
            ✕
          </button>
        </div>

        {/* THREAD CONTENT */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 space-y-6 overscroll-contain">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Student</p>
              <p className="font-medium text-slate-900">
                {ticket.name || 'Anonymous'}
              </p>
              <p className="text-slate-500 text-xs">{ticket.email}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-slate-400 text-xs mb-0.5">Submitted</p>
              <p className="text-slate-700 text-xs sm:text-sm">
                {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-start max-w-[90%]">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm text-sm">
                <p className="text-[10px] font-bold text-blue-600 mb-1 uppercase">
                  Original Message
                </p>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {ticket.message}
                </p>
              </div>
            </div>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[90%] ${msg.sender_type === 'admin' ? 'ml-auto items-end' : 'items-start'}`}
              >
                <div
                  className={`p-4 rounded-2xl shadow-sm ${msg.sender_type === 'admin' ? 'bg-slate-900 text-slate-50 rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}
                >
                  <p className="text-[10px] font-bold mb-1 uppercase opacity-70">
                    {msg.sender_type === 'admin' ? 'Support Agent' : 'Student'}
                  </p>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </p>
                  <p className="text-[9px] mt-2 opacity-50 text-right">
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
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Status Action:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-slate-900 transition-all ${statusStyles[status]}`}
                  >
                    <option value="open">Keep Open</option>
                    <option value="in_progress">Mark In Progress</option>
                    <option value="waiting_on_student">
                      Waiting on Student
                    </option>
                    <option value="resolved">Mark as Resolved</option>
                    <option value="closed">Close Ticket</option>
                  </select>
                </div>
                {message.trim().length === 0 && (
                  <span className="text-[10px] font-bold text-amber-600 animate-pulse uppercase">
                    Message required
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Type your response..."
                  className="w-full border border-slate-200 rounded-xl p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all resize-none text-sm"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !message.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg active:scale-95"
                >
                  {isPending ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>➤</span>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-slate-100 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                <p className="text-xs font-bold text-slate-600 uppercase">
                  Ticket {ticket.status}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setStatus('in_progress')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-6 py-2.5 rounded-xl transition-colors"
                >
                  Reopen & Reply
                </button>
                {ticket.status === 'resolved' && (
                  <button
                    onClick={handleQuickClose}
                    className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-6 py-2.5 rounded-xl transition-colors"
                  >
                    Close Permanently
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

/**
 * HELPERS
 */
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

function formatRelativeTime(date) {
  const diff = new Date() - new Date(date);
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
