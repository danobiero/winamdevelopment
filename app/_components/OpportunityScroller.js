'use client';

import { useRef, useState, useEffect } from 'react';
import OpportunityCard from './OpportunityCard';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function OpportunityScroller({ opportunities }) {
  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);

  // Reset index when opportunity list changes (e.g. filter change)
  useEffect(() => {
    setIndex(0);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }, [opportunities]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth === 0) return;
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
    if (index < opportunities.length - 1) scrollToIndex(index + 1);
  };

  if (!opportunities || opportunities.length === 0) return null;

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center">
      {/* Cards Scroller Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="
          flex
          overflow-x-auto
          scrollbar-hide
          snap-x snap-mandatory
          w-full
          py-2
          -webkit-overflow-scrolling-touch
        "
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {opportunities.map((opportunity) => (
          <div
            key={opportunity.id}
            className="snap-center shrink-0 w-full px-1.5"
          >
            <OpportunityCard opportunity={opportunity} />
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Float on Left/Right for 1-handed tapping) */}
      {opportunities.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={handlePrev}
              type="button"
              className="
                absolute left-[-10px] top-1/2 -translate-y-1/2
                bg-white/95 backdrop-blur-md text-slate-800 w-9 h-9
                flex items-center justify-center rounded-full shadow-lg border border-slate-200
                hover:bg-blue-600 hover:text-white transition-all z-20 active:scale-90
              "
              aria-label="Previous opportunity"
            >
              <ChevronLeftIcon className="w-5 h-5 stroke-2" />
            </button>
          )}

          {index < opportunities.length - 1 && (
            <button
              onClick={handleNext}
              type="button"
              className="
                absolute right-[-10px] top-1/2 -translate-y-1/2
                bg-white/95 backdrop-blur-md text-slate-800 w-9 h-9
                flex items-center justify-center rounded-full shadow-lg border border-slate-200
                hover:bg-blue-600 hover:text-white transition-all z-20 active:scale-90
              "
              aria-label="Next opportunity"
            >
              <ChevronRightIcon className="w-5 h-5 stroke-2" />
            </button>
          )}
        </>
      )}

      {/* Dot Indicators & Slide Counter */}
      {opportunities.length > 1 && (
        <div className="flex flex-col items-center gap-2 mt-3.5">
          <div className="flex items-center justify-center gap-1.5">
            {opportunities.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => scrollToIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === i
                    ? 'w-6 bg-blue-600'
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {index + 1} of {opportunities.length}
          </span>
        </div>
      )}
    </div>
  );
}
