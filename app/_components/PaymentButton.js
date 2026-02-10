'use client';

import { useState } from 'react';
import { createCheckoutSession } from '@/app/_lib/actions';

export default function PaymentButton({ bookingId }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      const session = await createCheckoutSession(bookingId);

      if (session?.url) {
        window.location.href = session.url;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className={`
        /* Layout: Full width on mobile/narrow, auto on desktop */
        w-full sm:w-auto 
        px-6 py-2.5 sm:py-3
        
        /* Typography & Style */
        text-sm sm:text-base font-bold uppercase tracking-wide
        bg-logo-100 text-white rounded-lg shadow-sm
        
        /* Interactions */
        transition-all duration-200
        hover:bg-logo-100/90 hover:shadow-md
        active:scale-[0.98]
        
        /* Loading/Disabled States */
        disabled:opacity-60 disabled:cursor-not-allowed
        flex items-center justify-center gap-2
      `}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="truncate text-xs">Processing...</span>
        </>
      ) : (
        <span className="truncate">Pay Now</span>
      )}
    </button>
  );
}
