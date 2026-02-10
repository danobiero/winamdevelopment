'use client';

import { useState, useEffect } from 'react';
import { attachCalendarEvent } from './actions';

export default function AttachEventModal({ event, onClose }) {
  const [bookings, setBookings] = useState([]);

  // Load existing bookings to choose from
  useEffect(() => {
    fetch('/api/admin/bookings')
      .then((res) => res.json())
      .then((data) => setBookings(data));
  }, []);

  async function handleAttach(bookingId) {
    await attachCalendarEvent({ bookingId, event });
    onClose();
    alert('Event attached successfully.');
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Attach Event to Booking</h3>

        <p className="text-sm text-primary-500 mb-4">
          <strong>Event:</strong> {event.title}
        </p>

        <ul className="space-y-3">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex justify-between items-center border-b pb-2"
            >
              <div>
                <p className="font-medium">Booking #{b.id}</p>
                <p className="text-xs text-primary-500">
                  {b.students?.fullName}
                </p>
              </div>

              <button
                onClick={() => handleAttach(b.id)}
                className="px-3 py-1 bg-primary-900 text-white rounded"
              >
                Attach
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={onClose}
          className="mt-4 text-primary-900 underline block mx-auto"
        >
          Close
        </button>
      </div>
    </div>
  );
}
