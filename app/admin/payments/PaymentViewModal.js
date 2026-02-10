'use client';

import { useRouter } from 'next/navigation';

export default function PaymentViewModal({ payment }) {
  const router = useRouter();
  if (!payment) return null;

  const handleClose = () => {
    // Navigates back to the list without a full browser refresh
    router.push('/admin/payments', { scroll: false });
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose} // Close when clicking backdrop
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
      >
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Payment Details</h2>
          <p className="text-xs text-slate-500 font-mono">#{payment.id}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Amount
              </span>
              <span className="text-lg font-black text-emerald-600">
                ${payment.amount}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Status
              </span>
              <span
                className={`text-sm font-bold capitalize ${payment.status === 'succeeded' ? 'text-blue-600' : 'text-amber-600'}`}
              >
                {payment.status}
              </span>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-50 pt-4 text-sm">
            <p className="flex justify-between">
              <strong className="text-slate-500 font-medium">
                Booking ID:
              </strong>
              <span className="text-slate-900">#{payment.booking_id}</span>
            </p>
            <p className="flex justify-between">
              <strong className="text-slate-500 font-medium">Client:</strong>
              <span className="text-slate-900">
                {payment.students?.fullName}
              </span>
            </p>
            <p className="flex justify-between">
              <strong className="text-slate-500 font-medium">Date:</strong>
              <span className="text-slate-900">
                {new Date(payment.created_at).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg">
            <strong className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Description
            </strong>
            <p className="text-sm text-slate-700 leading-relaxed">
              {payment.description || 'No description provided.'}
            </p>
          </div>

          {payment.receipt_url && (
            <a
              href={payment.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition"
            >
              <span>View Official Receipt</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button
            onClick={handleClose}
            className="w-full bg-white border border-slate-200 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
