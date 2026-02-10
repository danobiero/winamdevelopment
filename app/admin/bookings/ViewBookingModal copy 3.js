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

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('view');

    router.replace(
      params.toString() ? `${pathname}?${params.toString()}` : pathname
    );
  };

  const formattedPrice = FormatCurrency(booking.totalPrice);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-[400px] max-h-[90vh] overflow-y-auto relative">
        <h2 className="text-xl font-bold mb-4">Booking #{booking.id}</h2>

        <p>
          <strong>Lesson:</strong> {booking.lessons?.name}
        </p>
        <p>
          <strong>Client:</strong> {booking.students?.fullName}
        </p>
        <p>
          <strong>Students:</strong> {booking.numStudents}
        </p>
        <p>
          <strong>Dates:</strong> {formatDate(booking.startDate)} →{' '}
          {formatDate(booking.endDate)}
        </p>
        <p>
          <strong>Total Price:</strong> {formattedPrice}
        </p>
        <p>
          <strong>Status:</strong> {booking.isPaid ? 'Paid' : 'Unpaid'}
        </p>

        {/* ---- Refund Status ---- */}
        <div className="mt-4">
          <strong>Refunds:</strong>
          {booking.refunds?.length ? (
            <ul className="mt-2 space-y-2">
              {booking.refunds.map((refund) => (
                <li key={refund.id} className="border p-2 rounded bg-gray-50">
                  <p>
                    💸 <strong>{FormatCurrency(refund.refund_amount)}</strong>
                  </p>
                  <p className="text-sm text-gray-600 break-words">
                    <strong>Reason:</strong>{' '}
                    {refund.reason || 'No reason provided'}
                  </p>
                  <p className="text-sm">
                    <strong>Status:</strong>{' '}
                    <span className="font-semibold">{refund.status}</span>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-1">No refunds issued</p>
          )}
        </div>

        {/* ---- Admin Cancel Action ---- */}
        {!booking.cancelled && (
          <>
            <button
              onClick={() => setConfirmOpen(true)}
              className="mt-6 w-full px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700"
            >
              Cancel Booking
            </button>

            {confirmOpen && (
              <ConfirmationModal
                bookingId={booking.id}
                onCancel={() => setConfirmOpen(false)}
              />
            )}
          </>
        )}

        {booking.cancelled && (
          <div className="mt-6 text-center text-red-600 font-semibold">
            Booking has been cancelled
          </div>
        )}

        <button
          onClick={handleClose}
          className="mt-4 w-full px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
}
function ConfirmationModal({ bookingId, onCancel }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">
          Confirm Cancellation
        </h3>

        <p className="text-sm text-gray-600 mb-6">
          This will cancel the booking and create a refund request if a balance
          exists. This action cannot be undone.
        </p>

        <form action={cancelBookingAdmin} className="space-y-3">
          <input type="hidden" name="bookingId" value={bookingId} />
          <input type="hidden" name="reason" value="Cancelled by admin" />

          <button
            type="submit"
            className="w-full bg-red-600 text-white font-bold py-2 rounded hover:bg-red-700"
          >
            Yes, Cancel Booking
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full bg-gray-100 text-gray-700 font-bold py-2 rounded hover:bg-gray-200"
          >
            No, Keep Booking
          </button>
        </form>
      </div>
    </div>
  );
}
