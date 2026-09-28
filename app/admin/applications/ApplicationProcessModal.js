'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { processApplicationAction } from './membership-actions';

export default function ApplicationProcessModal({
  application,
  rejectionPolicies = [],
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionState, setActionState] = useState('idle'); // 'idle' | 'rejecting' | 'approving'

  if (!application) return null;

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('process');
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    );
  };

  const isPending =
    application.status?.toLowerCase() === 'applied' ||
    application.status?.toLowerCase() === 'reviewing';

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col relative overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-50 px-4 sm:px-6 py-4 border-b flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            {isPending ? 'Process Application' : 'Application Details'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          <div className="flex justify-between items-start border-b pb-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                App ID
              </p>
              <p className="font-mono text-sm text-gray-700">
                #{String(application.id).slice(0, 8)}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-100 text-blue-700 border border-blue-200">
              {application.status || 'applied'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Applicant
              </p>
              <p className="font-semibold text-gray-800">
                {application.full_name}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                {application.email}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Primary Interest
              </p>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border mt-1">
                {application.primary_interest || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {isPending ? (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t space-y-4 shrink-0">
            {/* IDLE STATE */}
            {actionState === 'idle' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setActionState('rejecting')}
                  className="flex-1 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-bold text-sm hover:bg-red-50 transition-all shadow-sm"
                >
                  Reject...
                </button>
                <button
                  type="button"
                  onClick={() => setActionState('approving')}
                  className="flex-1 bg-emerald-600 border border-emerald-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm"
                >
                  Approve...
                </button>
              </div>
            )}

            {/* APPROVING STATE */}
            {actionState === 'approving' && (
              <form
                action={async (formData) => {
                  setIsSubmitting(true);
                  const authority = formData.get('authority');

                  formData.append('decision_result', authority);
                  formData.append('status', 'approved');

                  await processApplicationAction(application.id, formData);
                  handleClose();
                }}
                className="space-y-4 animate-in slide-in-from-bottom-2"
              >
                <div>
                  <label className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1">
                    Approval Authority *
                  </label>
                  <select
                    name="authority"
                    required
                    className="w-full border border-emerald-200 bg-emerald-50/30 rounded-lg p-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Select who authorized this...</option>
                    <option value="Members Approved">Members Approved</option>
                    <option value="Executive Board Approved">
                      Executive Board Approved
                    </option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionState('idle')}
                    className="flex-1 bg-white border border-gray-200 py-3 rounded-xl font-bold text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Approval'}
                  </button>
                </div>
              </form>
            )}

            {/* REJECTING STATE */}
            {actionState === 'rejecting' && (
              <form
                action={async (formData) => {
                  setIsSubmitting(true);
                  const policyId = formData.get('policyId');
                  const notes = formData.get('notes');

                  const policy = rejectionPolicies.find(
                    (p) => p.id.toString() === policyId
                  );

                  const baseReason = `${policy.code}: ${policy.title}`;
                  // Combine policy + notes into the decision_result
                  const decisionStr = notes
                    ? `${baseReason} — ${notes}`
                    : baseReason;

                  formData.append('decision_result', decisionStr);
                  formData.append('status', 'rejected');

                  await processApplicationAction(application.id, formData);
                  handleClose();
                }}
                className="space-y-4 animate-in slide-in-from-bottom-2"
              >
                <div>
                  <label className="text-xs font-bold text-red-600 uppercase tracking-widest block mb-1">
                    Select Rejection Policy *
                  </label>
                  <select
                    name="policyId"
                    required
                    className="w-full border border-red-200 bg-red-50/30 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    <option value="">Select a reason...</option>
                    {rejectionPolicies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">
                    Internal Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Add context for this rejection..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActionState('idle')}
                    className="flex-1 bg-white border border-gray-200 py-3 rounded-xl font-bold text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="px-6 py-4 bg-gray-50 border-t shrink-0">
            <button
              onClick={handleClose}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800"
            >
              CLOSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
