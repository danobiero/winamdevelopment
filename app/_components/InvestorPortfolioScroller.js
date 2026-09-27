'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import InvestorPortfolioCard from './InvestorPortfolioCard';
import RedemptionModal from './RedemptionModal';
import toast from 'react-hot-toast';
import { formatClientError } from '@/app/_lib/client-error-handler';

export default function InvestorPortfolioScroller({
  investments,
  requestRedemptionAction, 
  getInvestmentValuationsAction 

}) {
  const router = useRouter();

  const scrollRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);

  // --- MODAL STATE ---
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [isWorking, setIsWorking] = useState(false);

  /**
   * -------------------------------------------------------------
   * MEASURE SLIDE WIDTH (SAFE)
   * -------------------------------------------------------------
   */
  useEffect(() => {
    if (!scrollRef.current || investments.length === 0) return;

    const firstSlide = scrollRef.current.children[0];
    if (firstSlide) {
      setSlideWidth(firstSlide.clientWidth);
    }
  }, [investments]);

  /**
   * -------------------------------------------------------------
   * SCROLL TRACKING (STABLE INDEX CALCULATION)
   * -------------------------------------------------------------
   */
  const handleScroll = () => {
    if (!scrollRef.current || !slideWidth) return;

    const { scrollLeft } = scrollRef.current;

    // 🔥 More stable than Math.round
    const newIndex = Math.floor((scrollLeft + slideWidth / 2) / slideWidth);

    setIndex(newIndex);
  };

  const scrollToIndex = (newIndex) => {
    if (!scrollRef.current || !slideWidth) return;

    scrollRef.current.scrollTo({
      left: newIndex * slideWidth,
      behavior: 'smooth',
    });
  };

  /**
   * -------------------------------------------------------------
   * REDEMPTION HANDLER (CORRECT SERVER ACTION USAGE)
   * -------------------------------------------------------------
   */
  async function handleRedemptionSubmit(id, { reason }) {
    try {
      setIsWorking(true);

      if (!reason) {
        toast.error('Please provide a reason for withdrawal.');
        return;
      }

      // ✅ Call server action passed from container
      await requestRedemptionAction(id, reason);

      toast.success('Withdrawal request submitted for review.');

      // Close modal
      setSelectedInvestment(null);

      // 🔥 Refresh UI to reflect DB changes
      router.refresh();
    } catch (err) {
      toast.error(formatClientError(err, 'Unable to submit withdrawal request. Please try again.'));
      console.error('Redemption Failed:', err);
    } finally {
      setIsWorking(false);
    }
  }

  const handlePrev = () => index > 0 && scrollToIndex(index - 1);

  const handleNext = () =>
    index < investments.length - 1 && scrollToIndex(index + 1);

  return (
    <div className="group relative w-full max-w-7xl mx-auto">
      {/* SCROLLER */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {investments.map((investment) => (
          <div
            key={investment.id}
            className="snap-center shrink-0 w-full px-2 md:px-8 lg:px-12"
          >
            <InvestorPortfolioCard
              investment={investment}
              activity={investment.activity}
              onWithdraw={() => setSelectedInvestment(investment)}
              getInvestmentValuationsAction={getInvestmentValuationsAction}
            />
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedInvestment && (
        <RedemptionModal
          investment={selectedInvestment}
          isWorking={isWorking}
          onClose={() => setSelectedInvestment(null)}
          onSubmit={handleRedemptionSubmit}
        />
      )}

      {/* NAV BUTTONS */}
      {investments.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={handlePrev}
              className="absolute left-0 md:left-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md text-slate-800 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full shadow-md border border-slate-200 hover:bg-white transition-all z-20 active:scale-90"
            >
              ‹
            </button>
          )}

          {index < investments.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-0 md:right-2 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md text-slate-800 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full shadow-md border border-slate-200 hover:bg-white transition-all z-20 active:scale-90"
            >
              ›
            </button>
          )}
        </>
      )}

      {/* DOTS */}
      {investments.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {investments.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === i ? 'w-8 bg-blue-600' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
