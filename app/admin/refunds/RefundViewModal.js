'use client';

import { useRouter } from 'next/navigation';

// Helper to format currency consistently
const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

export default function RefundViewModal({ refund, ledger=[] }) {
  const router = useRouter();

  const handleClose = () => {
    // Navigates back to the main list, clearing the search params
    router.push('/admin/refunds');
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the modal
      >
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Refund Details</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
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
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start border-b pb-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Refund ID
              </p>
              <p className="font-mono text-sm text-gray-700">{refund.id}</p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                refund.status === 'approved'
                  ? 'bg-green-100 text-green-700'
                  : refund.status === 'completed'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {refund.status || 'pending'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Booking
              </p>
              <p className="font-semibold text-blue-600">
                #{refund.booking_id}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Amount
              </p>
              <p className="font-bold text-gray-900">
                {formatCurrency(refund.refund_amount ?? 0)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Client
            </p>
            <p className="text-gray-800 font-medium">
              {refund.students?.fullName || 'Unknown'}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Reason for Refund
            </p>
            <div className="mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 italic">
              {refund.reason || 'No reason provided.'}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Last Updated
            </p>
            <p className="text-xs text-gray-500">
              {refund.updated_at
                ? new Date(refund.updated_at).toLocaleString()
                : '—'}
            </p>
          </div>
        </div>

        {/* Booking Ledger */}
        <div className="mt-6 bg-white border rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">
            Booking Financial Ledger
          </h3>

          {ledger.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              No financial activity recorded for this booking.
            </p>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-gray-500 border-b">
                  <th className="text-left py-1">Date</th>
                  <th className="text-left py-1">Type</th>
                  <th className="text-right py-1">Amount</th>
                  <th className="text-right py-1">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((row, i) => (
                  <tr key={i} className="border-b last:border-none">
                    <td className="py-1">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-1 capitalize">{row.entry_type}</td>
                    <td
                      className={`py-1 text-right font-medium ${
                        row.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(row.amount )}
                    </td>
                    <td className="py-1 text-right font-semibold">
                      {formatCurrency(row.running_balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t">
          <button
            onClick={handleClose}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all active:scale-[0.98] shadow-md"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
