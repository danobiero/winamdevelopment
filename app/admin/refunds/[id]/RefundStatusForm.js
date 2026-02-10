'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateRefundStatus } from '../refund-actions';

export default function RefundStatusForm({ refund, rejectionPolicies }) {
  const [status, setStatus] = useState(refund.status ?? 'pending');

  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';

  return (
    <form action={updateRefundStatus} className="space-y-6">
      <input type="hidden" name="refundId" value={refund.id} />

      {/* STATUS SELECT */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Refund Status
        </label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="pending">🟡 Pending</option>
          <option value="approved">🟢 Approved</option>
          <option value="rejected">🔴 Rejected</option>
        </select>
      </div>

      {/* REJECTION CONTROLS */}
      {isRejected && (
        <>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Rejection Policy
            </label>
            <select
              name="rejectionPolicyId"
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Select reason…</option>
              {rejectionPolicies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Internal Notes (optional)
            </label>
            <textarea
              name="rejectionNotes"
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </>
      )}

      {/* ACTIONS */}
      <div className="space-y-2">
        {status === 'approved' && (
          <Link
            href={`/admin/refunds?approved=${refund.id}`}
            className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
          >
            Continue to Refund
          </Link>
        )}

        {status !== 'approved' && (
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg"
          >
            Update Status
          </button>
        )}
      </div>
    </form>
  );
}
