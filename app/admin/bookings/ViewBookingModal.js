'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { FormatCurrency } from '@/app/_lib/utils';
import { cancelBookingAdmin } from './actions';

export default function ViewBookingModal({ booking }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Solves the "one day ahead" issue by forcing Central Time display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');
    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    );
  };

  const formattedPrice = FormatCurrency(booking.totalPrice);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 md:p-6">
      {/* Container */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col relative overflow-hidden">
        {/* Header - Sticky */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            Booking Details
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close modal"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-gray-700">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Booking ID
              </p>
              <p className="font-mono text-sm">#{booking.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                Payment Status
              </p>
              <span
                className={`inline-block px-2 py-0.5 rounded text-sm font-medium border ${
                  booking.isPaid
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                }`}
              >
                {booking.isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-3">
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Lesson:</span>
              <span className="font-semibold text-right">
                {booking.lessons?.name}
              </span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Client:</span>
              <span className="font-semibold text-right">
                {booking.students?.fullName}
              </span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Students:</span>
              <span className="font-semibold text-right">
                {booking.numStudents}
              </span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Dates:</span>
              <span className="font-semibold text-right text-sm">
                {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
              </span>
            </p>
            <p className="flex justify-between border-b pb-2">
              <span className="text-gray-500 font-bold">Total Price:</span>
              <span className="font-bold text-lg text-blue-600">
                {formattedPrice}
              </span>
            </p>
          </div>

          {/* ---- Refund History ---- */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">
              Refund History
            </h3>
            {booking.refunds?.length ? (
              <ul className="space-y-3">
                {booking.refunds.map((refund) => {
                  // Color Mapping logic
                  const statusColors = {
                    completed: 'bg-green-100 text-green-700 border-green-200',
                    pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                    rejected: 'bg-red-100 text-red-700 border-red-200',
                  };
                  const colorClass =
                    statusColors[refund.status?.toLowerCase()] ||
                    'bg-gray-100 text-gray-600 border-gray-200';

                  return (
                    <li
                      key={refund.id}
                      className="border p-3 rounded-lg bg-gray-50 text-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-gray-900">
                          💸 {FormatCurrency(refund.refund_amount)}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`capitalize px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}
                          >
                            {refund.status}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">
                            {formatDate(refund.updated_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 italic">
                        "{refund.reason || 'No reason provided'}"
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm italic">No refunds issued</p>
            )}
          </div>

          {/* ---- Actions ---- */}
          <div className="pt-4 space-y-3">
            {!booking.cancelled ? (
              <button
                onClick={() => setConfirmOpen(true)}
                className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors"
              >
                Cancel Booking
              </button>
            ) : (
              <div className="p-3 bg-red-50 text-red-700 text-center rounded-lg border border-red-100 font-bold">
                Booking has been cancelled
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full px-4 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Confirmation Overlay */}
        {confirmOpen && (
          <ConfirmationModal
            bookingId={booking.id}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

function ConfirmationModal({ bookingId, onCancel }) {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xs p-6 border animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Confirm Cancellation
        </h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          This will cancel the booking and create a refund request. This action
          cannot be undone.
        </p>

        <form action={cancelBookingAdmin} className="space-y-3">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="reason" value="Cancelled by admin" />

          <button
            type="submit"
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 active:scale-95 transition-all"
          >
            Yes, Cancel Booking
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-lg hover:bg-gray-200"
          >
            No, Keep Booking
          </button>
        </form>
      </div>
    </div>
  );
}
