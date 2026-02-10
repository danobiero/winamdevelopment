'use client';

import { useRef, useState } from 'react';
import OngoingReservationCard from './OngoingReservationCard';

export default function OngoingLessonsScroller({ lessons }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  const scrollToIndex = (newIndex) => {
    if (!scrollRef.current) return;

    const width = scrollRef.current.clientWidth;

    scrollRef.current.scrollTo({
      left: newIndex * width,
      behavior: 'smooth',
    });

    setIndex(newIndex);
  };

  const handlePrev = () => {
    if (index > 0) scrollToIndex(index - 1);
  };

  const handleNext = () => {
    if (index < lessons.length - 1) scrollToIndex(index + 1);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto">
      {/* Carousel Container */}
      <div
        ref={scrollRef}
        className="
          flex
          overflow-hidden
          snap-x snap-mandatory
          w-full
        "
      >
        {lessons.map((booking) => (
          <div
            key={booking.id}
            className="
              snap-center shrink-0 
              w-full
              px-0 md:px-4 lg:px-8
            "
          >
            {/* ⭐ Pass calendar events to the card */}
            <OngoingReservationCard
              booking={booking}
              calendarEvents={booking.calendarEvents}
            />
          </div>
        ))}
      </div>

      {/* LEFT ARROW */}
      {index > 0 && lessons.length > 1 && (
        <button
          onClick={handlePrev}
          className="
            absolute left-0 top-1/2 -translate-y-1/2 
            bg-primary-900 text-white px-3 py-2 
            rounded-full shadow hover:bg-primary-800
            z-20
          "
        >
          ‹
        </button>
      )}

      {/* RIGHT ARROW */}
      {index < lessons.length - 1 && lessons.length > 1 && (
        <button
          onClick={handleNext}
          className="
            absolute right-0 top-1/2 -translate-y-1/2 
            bg-primary-900 text-white px-3 py-2 
            rounded-full shadow hover:bg-primary-800
            z-20
          "
        >
          ›
        </button>
      )}
    </div>
  );
}
