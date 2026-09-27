'use client';

import { useState } from 'react';
import InvestModal from './InvestModal';

export default function InvestAction({
  opportunity,
  user,
  paymentMode = 'manual',
  className,
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* BUTTON */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          'bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl text-base sm:text-lg font-bold shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto'
        }
      >
        Start Investing Now
      </button>

      {/* MODAL */}
      {open && (
        <InvestModal
          opportunity={opportunity}
          user={user}
          initialPaymentMode={paymentMode}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
