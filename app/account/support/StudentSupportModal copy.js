'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { replyAsStudent } from '../../_lib/actions';

export default function StudentSupportModal({ ticket, messages, onClose }) {
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const scrollRef = useRef(null);

  const isClosed = ticket.status === 'closed';

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleReply = () => {
    if (!message.trim() || isClosed) return;

    startTransition(async () => {
      await replyAsStudent({
        supportId: ticket.id,
        message,
      });

      setMessage('');
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 italic">
            {ticket.subject}
          </h2>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
          >
            ✕
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.sender_type === 'admin' ? 'justify-start' : 'justify-end'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.sender_type === 'admin'
                    ? 'bg-white text-slate-800'
                    : 'bg-primary-900 text-white'
                }`}
              >
                {msg.message}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t">
          {isClosed ? (
            <div className="bg-slate-100 p-4 rounded-xl text-center text-slate-500 text-sm font-medium">
              This conversation is closed.
            </div>
          ) : (
            <div className="flex gap-2 bg-slate-100 p-2 rounded-2xl">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-none focus:ring-0 p-2 text-sm"
              />

              <button
                onClick={handleReply}
                disabled={isPending || !message.trim()}
                className="bg-primary-900 text-white px-4 py-2 rounded-xl disabled:bg-slate-300"
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
