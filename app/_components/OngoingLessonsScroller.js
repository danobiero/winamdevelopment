'use client';

import { useRef, useState } from 'react';
import OngoingReservationCard from './OngoingReservationCard';

export default function OngoingLessonsScroller({ lessons }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

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
    <div className="group relative w-full max-w-7xl mx-auto">
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
              px-2 md:px-8 lg:px-12
            "
          >
            <OngoingReservationCard
              booking={booking}
              calendarEvents={booking.calendarEvents}
            />
          </div>
        ))}
      </div>

      {/* NAVIGATION ARROWS - Now visible on mobile */}
      {lessons.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={handlePrev}
              className="
                absolute left-0 md:left-2 top-1/2 -translate-y-1/2 
                bg-white/80 backdrop-blur-md text-slate-800 w-8 h-8 md:w-10 md:h-10 
                flex items-center justify-center rounded-full shadow-md border border-slate-200
                hover:bg-white transition-all z-20 active:scale-90
              "
              aria-label="Previous lesson"
            >
              <span className="text-xl md:text-2xl mb-0.5">‹</span>
            </button>
          )}

          {index < lessons.length - 1 && (
            <button
              onClick={handleNext}
              className="
                absolute right-0 md:right-2 top-1/2 -translate-y-1/2 
                bg-white/80 backdrop-blur-md text-slate-800 w-8 h-8 md:w-10 md:h-10 
                flex items-center justify-center rounded-full shadow-md border border-slate-200
                hover:bg-white transition-all z-20 active:scale-90
              "
              aria-label="Next lesson"
            >
              <span className="text-xl md:text-2xl mb-0.5">›</span>
            </button>
          )}
        </>
      )}

      {/* DOT INDICATORS */}
      {lessons.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {lessons.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === i ? 'w-8 bg-blue-600' : 'w-1.5 bg-slate-200'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
