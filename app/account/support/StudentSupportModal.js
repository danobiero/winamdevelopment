'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { replyAsStudent } from '../../_lib/actions';

export default function StudentSupportModal({ ticket, messages, onClose }) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [viewportHeight, setViewportHeight] = useState('100vh');
  const router = useRouter();
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const isClosed = ticket.status === 'closed';

  // 1. Fix for Mobile Keyboards and Browser UI bars
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        // Set the height of the modal to exactly what the user sees
        setViewportHeight(`${window.visualViewport.height}px`);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // 2. Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleReply = () => {
    if (!message.trim() || isClosed) return;

    startTransition(async () => {
      await replyAsStudent({
        supportId: ticket.id,
        message,
      });
      setMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center transition-[height] duration-100 ease-out"
      style={{ height: viewportHeight }}
    >
      <div className="bg-white w-full h-full sm:h-[85vh] sm:max-h-[700px] sm:max-w-2xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header - Fixed height */}
        <div className="px-5 py-4 border-b flex justify-between items-center bg-white shrink-0">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              Ticket Discussion
            </span>
            <h2 className="text-lg font-black text-[#000033] leading-tight truncate">
              {ticket.subject}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages Area - Flexible height */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8fafc] overscroll-contain"
        >
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === 'admin';
            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isAdmin ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isAdmin
                        ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        : 'bg-blue-600 text-white rounded-tr-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {isAdmin ? 'Support Team' : 'You'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Area - Anchored to bottom, accounts for iOS safe area */}
        <div className="p-4 bg-white border-t shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {isClosed ? (
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
              Resolution reached • Thread closed
            </div>
          ) : (
            <div className="flex items-end gap-2 bg-slate-100 p-2 rounded-2xl focus-within:bg-slate-200/50 transition-colors shadow-inner">
              <textarea
                ref={textareaRef}
                rows={1}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-base sm:text-sm resize-none"
                style={{ maxHeight: '120px' }}
              />

              <button
                onClick={handleReply}
                disabled={isPending || !message.trim()}
                className="bg-blue-600 text-white p-2.5 rounded-xl disabled:bg-slate-300 transition-all hover:bg-blue-700 active:scale-90 shrink-0 shadow-md flex items-center justify-center min-w-[44px] min-h-[44px]"
              >
                {isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5 rotate-90"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
