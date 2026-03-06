'use client';

import React, { useOptimistic } from 'react';
import ReservationCard from './ReservationCard';
import { deleteReservation } from '../_lib/actions';

function ReservationList({ bookings }) {
  const [optimisticBookings, optimisticDelete] = useOptimistic(
    bookings,
    (curBookings, bookingId) => {
      return curBookings.filter((booking) => booking.id !== bookingId);
    }
  );

  async function handleDelete(bookingId) {
    optimisticDelete(bookingId);
    try {
      await deleteReservation(bookingId);
    } catch (error) {
      console.error('Failed to delete reservation:', error);
    }
  }

  if (optimisticBookings.length === 0) {
    return (
      <div className="text-center bg-primary-50 p-10 rounded-xl border border-dashed border-primary-200">
        <p className="text-lg text-primary-600">No reservations found.</p>
      </div>
    );
  }

  const isSingle = optimisticBookings.length === 1;

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {optimisticBookings.map((booking) => (
        <li
          key={booking.id}
          className={`transition-all duration-300 ${isSingle ? 'md:col-span-2' : ''}`}
        >
          <ReservationCard
            booking={booking}
            onDelete={handleDelete}
            isFullWidth={isSingle}
          />
        </li>
      ))}
    </ul>
  );
}

export default ReservationList;
