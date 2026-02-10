'use client';

import React, { useOptimistic } from 'react';
import ReservationCard from './ReservationCard';
import { deleteReservation } from '../_lib/actions';

function ReservationList({ bookings }) {
  // Optimistic state handles the immediate removal of the card
  const [optimisticBookings, optimisticDelete] = useOptimistic(
    bookings,
    (curBookings, bookingId) => {
      return curBookings.filter((booking) => booking.id !== bookingId);
    }
  );

  async function handleDelete(bookingId) {
    // 1. Update UI immediately
    optimisticDelete(bookingId);

    // 2. Perform the server action
    try {
      await deleteReservation(bookingId);
    } catch (error) {
      // Note: In a production app, you might want to show a
      // toast notification here if the delete fails.
      console.error('Failed to delete reservation:', error);
    }
  }

  // Handle the case where all optimistic bookings are deleted
  if (optimisticBookings.length === 0) {
    return (
      <div className="text-center bg-primary-50 p-10 rounded-xl border border-dashed border-primary-200">
        <p className="text-lg text-primary-600">No reservations found.</p>
      </div>
    );
  }

  return (
    /* Using 'animate-pulse' or transitions on the container can help 
       the user perceive the 'optimistic' change more smoothly.
    */
    <ul className="space-y-4 md:space-y-6">
      {optimisticBookings.map((booking) => (
        <li key={booking.id} className="transition-all duration-300">
          <ReservationCard booking={booking} onDelete={handleDelete} />
        </li>
      ))}
    </ul>
  );
}

export default ReservationList;
