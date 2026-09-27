'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFormStatus } from 'react-dom'; // ADDED for loading states
import { updateRedemptionStatus } from '../redemption-actions';

// ADDED: Extracted submit button to use the useFormStatus hook
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-lg transition-colors flex justify-center items-center"
    >
      {pending ? 'Updating...' : 'Update Status'}
    </button>
  );
}

export default function RedemptionStatusForm({
  redemption,
  rejectionPolicies,
}) {
  const [status, setStatus] = useState(redemption.status ?? 'pending');

  const isRejected = status === 'rejected';

  return (
    <form action={updateRedemptionStatus} className="space-y-6">
      <input type="hidden" name="redemptionId" value={redemption.id} />

      {/* STATUS SELECT */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          Redemption Status
        </label>
        <select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="pending">🟡 Pending</option>
          <option value="approved">🟢 Approved</option>
          <option value="completed">🔵 Completed</option>
          <option value="rejected">🔴 Rejected</option>
        </select>
      </div>

      {/* REJECTION CONTROLS */}
      {isRejected && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Rejection Policy
            </label>
            <select
              name="rejectionPolicyId"
              required
              // ADDED: Pre-select existing policy if available
              defaultValue={redemption.rejection_policy_id || ''}
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
              // ADDED: Pre-fill existing admin notes
              defaultValue={redemption.admin_notes || ''}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="Provide context for rejection..."
            />
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className="space-y-2 pt-2">
        {status === 'approved' && (
          <Link
            href={`/admin/redemptions?approved=${redemption.id}`}
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors shadow-sm"
          >
            Continue to Stripe Payout &rarr;
          </Link>
        )}

        {/* UPDATED: Replaced native button with component to handle pending state */}
        {status !== 'approved' && <SubmitButton />}
      </div>
    </form>
  );
}
