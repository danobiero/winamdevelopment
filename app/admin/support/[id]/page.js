import {
  getSupportById,
  replyToSupportTicket,
  updateSupportStatus,
} from '../actions';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SupportDetailPage({ params }) {
  const { id } = params;

  if (!id || isNaN(Number(id))) {
    return notFound();
  }

  const { ticket, messages } = await getSupportById(id);

  if (!ticket) {
    return notFound();
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary-900 mb-2">
          {ticket.subject}
        </h1>

        <div className="flex items-center gap-4 text-sm text-primary-500">
          <span>Ticket #{ticket.id}</span>
          <StatusBadge status={ticket.status} />
          <span>Created: {new Date(ticket.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* THREAD */}
      <div className="bg-white border border-primary-100 rounded-xl p-6 space-y-6 mb-8">
        {messages.length === 0 && (
          <div className="text-primary-500">No messages yet.</div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-4 rounded-xl max-w-xl ${
              msg.sender_type === 'admin'
                ? 'bg-primary-900 text-white ml-auto'
                : 'bg-primary-50 text-primary-900'
            }`}
          >
            <div className="text-sm opacity-80 mb-1">
              {msg.sender_type === 'admin' ? 'Admin' : 'Client'}
            </div>
            <div className="whitespace-pre-wrap">{msg.message}</div>
            <div className="text-xs opacity-60 mt-2">
              {new Date(msg.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* REPLY FORM */}
      <form
        action={async (formData) => {
          'use server';

          const message = formData.get('message');

          await replyToSupportTicket({
            supportId: ticket.id,
            message,
          });
        }}
        className="mb-6"
      >
        <textarea
          name="message"
          placeholder="Write your reply..."
          required
          className="w-full border border-primary-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-primary-300"
          rows={4}
        />

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="bg-primary-900 text-white px-6 py-2 rounded-xl font-semibold hover:bg-primary-800 transition"
          >
            Send Reply
          </button>
        </div>
      </form>

      {/* STATUS UPDATE */}
      <form
        action={async (formData) => {
          'use server';

          const status = formData.get('status');

          await updateSupportStatus({
            supportId: ticket.id,
            status,
          });
        }}
        className="flex items-center gap-4"
      >
        <select
          name="status"
          defaultValue={ticket.status}
          className="border border-primary-200 rounded-lg px-4 py-2"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_on_student">Waiting on Client</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>

        <button
          type="submit"
          className="bg-primary-100 text-primary-900 px-4 py-2 rounded-lg font-semibold hover:bg-primary-200 transition"
        >
          Update Status
        </button>
      </form>
    </div>
  );
}

function StatusBadge({ status }) {
  const base = 'px-3 py-1 text-xs font-bold rounded-full inline-block';

  const styles = {
    open: 'bg-red-100 text-red-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    waiting_on_student: 'bg-blue-100 text-blue-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-200 text-gray-600',
  };

  return (
    <span className={`${base} ${styles[status] || styles.open}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
