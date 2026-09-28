'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { replyAsShareholder } from '../../_lib/actions';

export default function ShareholderSupportModal({ ticket, messages, onClose }) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const [viewportHeight, setViewportHeight] = useState('100vh');

  const router = useRouter();
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const isClosed = ticket.status === 'closed';

  /**
   * 1. Fix mobile viewport height
   */
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
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

  /**
   * 2. Auto scroll to latest message
   */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  /**
   * 3. Send reply
   */
  const handleReply = () => {
    if (!message.trim() || isClosed) return;

    startTransition(async () => {
      await replyAsShareholder({
        supportId: ticket.id,
        message,
      });

      setMessage('');

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      router.refresh();
    });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center"
      style={{ height: viewportHeight }}
    >
      <div className="bg-white w-full h-full sm:h-[85vh] sm:max-h-[700px] sm:max-w-2xl sm:rounded-3xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b flex justify-between items-center bg-white shrink-0">
          <div className="flex flex-col min-w-0">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Ticket Discussion
            </span>
            <h2 className="text-lg font-black text-[#000033] leading-tight truncate">
              {ticket.subject}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#f8fafc]"
        >
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === 'admin';

            return (
              <div
                key={msg.id}
                className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`flex flex-col max-w-[75%] ${
                    isAdmin ? 'items-start' : 'items-end'
                  }`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                      isAdmin
                        ? 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                        : 'bg-blue-600 text-white rounded-tr-none'
                    }`}
                  >
                    {msg.message}
                  </div>

                  <span className="text-xs text-slate-400 mt-1 px-1">
                    {isAdmin ? 'Support Team' : 'You'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t">
          {isClosed ? (
            <div className="bg-slate-50 border p-3 rounded-xl text-center text-slate-500 text-xs font-bold uppercase">
              Thread closed
            </div>
          ) : (
            <div className="flex items-end gap-2 bg-slate-100 p-2 rounded-2xl">
              <textarea
                ref={textareaRef}
                rows={1}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(
                    e.target.scrollHeight,
                    120
                  )}px`;
                }}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-none focus:ring-0 p-2 resize-none"
              />

              <button
                onClick={handleReply}
                disabled={isPending || !message.trim()}
                className="bg-blue-600 text-white p-2.5 rounded-xl disabled:bg-slate-300"
              >
                {isPending ? '...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
