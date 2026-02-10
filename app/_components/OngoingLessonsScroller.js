'use client';

import { useRef, useState, useEffect } from 'react';
import OngoingReservationCard from './OngoingReservationCard';

export default function OngoingLessonsScroller({ lessons }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  // Update index based on scroll position (detects manual swipes on mobile)
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const newIndex = Math.round(scrollLeft / clientWidth);
    setIndex(newIndex);
  };

  const scrollToIndex = (newIndex) => {
    if (!scrollRef.current) return;
    const width = scrollRef.current.clientWidth;
    scrollRef.current.scrollTo({
      left: newIndex * width,
      behavior: 'smooth',
    });
  };

  const handlePrev = () => {
    if (index > 0) scrollToIndex(index - 1);
  };

  const handleNext = () => {
    if (index < lessons.length - 1) scrollToIndex(index + 1);
  };

  return (
    <div className="group relative w-full max-w-7xl mx-auto px-1">
      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="
          flex
          overflow-x-auto 
          scrollbar-hide
          snap-x snap-mandatory
          w-full
          -webkit-overflow-scrolling-touch
        "
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {lessons.map((booking) => (
          <div
            key={booking.id}
            className="
              snap-center shrink-0 
              w-full
              px-1 md:px-4 lg:px-8
            "
          >
            <OngoingReservationCard
              booking={booking}
              calendarEvents={booking.calendarEvents}
            />
          </div>
        ))}
      </div>

      {/* NAVIGATION ARROWS - Hidden on small mobile, visible on hover/tablet+ */}
      {lessons.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={handlePrev}
              className="
                hidden md:flex
                absolute left-2 top-1/2 -translate-y-1/2 
                bg-primary-900/80 backdrop-blur-sm text-white w-10 h-10 
                items-center justify-center rounded-full shadow-lg
                hover:bg-primary-800 transition-all z-20
              "
              aria-label="Previous lesson"
            >
              <span className="text-2xl mb-1">‹</span>
            </button>
          )}

          {index < lessons.length - 1 && (
            <button
              onClick={handleNext}
              className="
                hidden md:flex
                absolute right-2 top-1/2 -translate-y-1/2 
                bg-primary-900/80 backdrop-blur-sm text-white w-10 h-10 
                items-center justify-center rounded-full shadow-lg
                hover:bg-primary-800 transition-all z-20
              "
              aria-label="Next lesson"
            >
              <span className="text-2xl mb-1">›</span>
            </button>
          )}
        </>
      )}

      {/* DOT INDICATORS - Essential for Mobile UX */}
      {lessons.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {lessons.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-2 rounded-full transition-all ${
                index === i ? 'w-6 bg-accent-500' : 'w-2 bg-primary-200'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
