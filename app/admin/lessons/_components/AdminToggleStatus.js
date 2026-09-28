'use client';

import { useTransition } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import { toggleLessonStatusAction } from '@/app/admin/lessons/actions';

export default function AdminToggleStatus({ lessonId, currentCategory }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast(); // Initialize the toast function

  // Category 1 is active, anything else (like 0) is considered inactive for this toggle
  const isActive = currentCategory === 1;

  function handleToggle() {
    startTransition(async () => {
      try {
        await toggleLessonStatusAction(lessonId, currentCategory);
        // Success is usually handled by the redirect in the action,
        // but you can call showToast here if you don't redirect.
        
      } catch (err) {
        // Replace alert with showToast
        showToast(err.message || 'Failed to update status', 'error');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-xs font-bold uppercase tracking-tighter ${
          isActive ? 'text-emerald-600' : 'text-slate-400'
        }`}
      >
        {isActive ? 'Live' : 'Hidden'}
      </span>

      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none
          ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}
          ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label="Toggle Lesson Status"
      >
        <span
          className={`
            inline-block h-3.5 w-3.5 transform rounded-full bg-white transition duration-200 ease-in-out
            ${isActive ? 'translate-x-5' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}
