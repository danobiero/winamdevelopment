'use client';

import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onClose?.();
    }, 5000); // Slightly longer to allow reading while it animates
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!show) return null;

  // Modern Slate-based color palette
  const styles = {
    success: 'bg-emerald-600 shadow-emerald-100',
    error: 'bg-rose-600 shadow-rose-100',
    warning: 'bg-amber-500 shadow-amber-100',
  };

  return (
    /* RESPONSIVE POSITIONING:
       Mobile: Fixed at the top-center (best for focus).
       Desktop (sm): Stays at the top-right.
    */
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:top-6 z-[100] pointer-events-none flex justify-center sm:justify-end">
      <div
        className={`
          ${styles[type] || styles.success} 
          text-white px-6 py-3 rounded-xl shadow-2xl 
          font-bold text-sm tracking-wide
          animate-in fade-in slide-in-from-top-4 duration-300
          pointer-events-auto
        `}
      >
        <div className="flex items-center gap-2">
          {/* Subtle status indicator */}
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          {message}
        </div>
      </div>
    </div>
  );
}
