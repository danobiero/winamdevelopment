'use client';

import { useState } from 'react';
import { CreditCardIcon } from '@heroicons/react/24/outline';
import { createCheckoutSessionForFee } from '@/app/_lib/actions';

export default function FeesPaymentButton({ feeId, email, amount, shareholderId}) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    // Defensive check: Ensure we have the ID needed for your new table structure
    if (!shareholderId) {
      console.error('Missing shareholderId for payment');
      alert(
        'System error: Could not identify shareholder. Please refresh and try again.'
      );
      return;
    }
    try {
      setLoading(true);

      const checkoutSession = await createCheckoutSessionForFee(
        feeId,
        email,
        shareholderId
      );

      if (checkoutSession?.url) {
        window.location.href = checkoutSession.url;
      } else {
        alert('Failed to create checkout checkoutSession. Please try again.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };;

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:bg-slate-400"
    >
      <CreditCardIcon className="h-6 w-6" />

      {loading
        ? 'Processing...'
        : `Pay Application Fee $${Number(amount).toFixed(2)}`}
    </button>
  );
}
