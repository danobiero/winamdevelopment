'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import AttachEventModal from './AttachEventModal';

export default function CalendarEventCard({ event }) {
  const [open, setOpen] = useState(false);

  
  return (
    <>
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="text-lg font-semibold">{event.title}</h3>

        <p className="text-primary-600 mt-1">
          {format(new Date(event.start), 'EEE, MMM dd, p')} →{' '}
          {format(new Date(event.end), 'p')}
        </p>

        {event.meetLink && (
          <a
            href={event.meetLink}
            target="_blank"
            className="text-blue-600 underline text-sm"
          >
            Google Meet Link
          </a>
        )}

        <p className="text-sm text-primary-500 mt-2 line-clamp-3">
          {event.description}
        </p>

        <button
          onClick={() => setOpen(true)}
          className="mt-4 px-3 py-2 bg-primary-900 text-white rounded"
        >
          Attach to Booking
        </button>
      </div>

      {open && (
        <AttachEventModal event={event} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
