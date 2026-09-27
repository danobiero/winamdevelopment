'use client';

import { useState, useTransition } from 'react';
import { replyToSupportTicket, updateSupportStatus } from './actions';

export default function SupportViewModal({ ticket, messages = [], onClose }) {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(ticket.status);
  const [isPending, startTransition] = useTransition();

  if (!ticket) return null;

  const isCurrentlyResolved = status === 'resolved' || status === 'closed';
  const isDbResolved =
    ticket.status === 'resolved' || ticket.status === 'closed';
  const showResolvedUI = isDbResolved && isCurrentlyResolved;

  const handleSubmit = () => {
    if (!message.trim()) return;
    startTransition(async () => {
      await replyToSupportTicket({ supportId: ticket.id, message });
      await updateSupportStatus({ supportId: ticket.id, status: status });
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

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 space-y-6 overscroll-contain">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-0.5">Client</p>
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
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                <p className="text-[10px] font-bold text-blue-600 mb-1 uppercase tracking-tight">
                  Original Message
                </p>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">
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
                    {msg.sender_type === 'admin' ? 'Support Agent' : 'Client'}
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

        {/* FOOTER AREA */}
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
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all ${statusStyles[status]}`}
                  >
                    <option value="open">Keep Open</option>
                    <option value="in_progress">Mark In Progress</option>
                    <option value="waiting_on_student">
                      Waiting on Client
                    </option>
                    <option value="resolved">Mark as Resolved</option>
                    <option value="closed">Close Ticket</option>
                  </select>
                </div>
                {message.trim().length === 0 && (
                  <span className="text-[10px] font-bold text-amber-600 animate-pulse uppercase">
                    Message required to save changes
                  </span>
                )}
              </div>

              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Explain the resolution or ask a follow-up question..."
                  className="w-full border border-slate-200 rounded-xl p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none text-sm"
                />
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !message.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg active:scale-95"
                  title="Send message and update status"
                >
                  {isPending ? (
                    <span className="h-5 w-5 block border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  )}
                </button>
              </div>

              {/* INBOX ZERO ACTIONS */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !message.trim()}
                  className="px-6 py-2 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-blue-100 transition-all disabled:opacity-50"
                >
                  {isPending ? 'Processing...' : 'Send & Close View'}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-slate-100 px-4 py-2 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">
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
                    disabled={isPending}
                    className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 px-6 py-2.5 rounded-xl transition-colors"
                  >
                    {isPending ? 'Closing...' : 'Close Permanently'}
                  </button>
                )}

                {/* BACK TO LIST BUTTON */}
                <button
                  onClick={onClose}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 px-4 py-2.5"
                >
                  Back to List
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
