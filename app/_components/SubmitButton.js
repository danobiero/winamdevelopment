'use client';
import React from 'react';
import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children, pendingLabel }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      className={`
        /* Layout: Full width on mobile, auto width on desktop */
        w-full md:w-auto 
        px-8 py-4 
        
        /* Typography & Style */
        text-white font-bold uppercase tracking-wide text-sm
        rounded-lg bg-blue-900
        
        /* Transitions & Interactions */
        transition-all duration-200 
        hover:bg-logo-10 hover:shadow-lg
        active:scale-[0.98]
        
        /* Disabled State */
        disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-100
        
        /* Centering content for the loading state */
        flex items-center justify-center gap-2
      `}
    >
      {pending ? (
        <>
          {/* Optional: Simple CSS Spinner */}
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
