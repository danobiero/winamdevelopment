'use client';

import { useTransition } from 'react';
import { useToast } from '@/app/_lib/ToastContext';
import { toggleOpportunityStatusAction } from '@/app/admin/opportunities/actions';

export default function AdminToggleStatus({ opportunityId, currentStatus }) {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  // Check if the string status is 'active'
  const isActive = currentStatus === 'active';

  function handleToggle() {
    startTransition(async () => {
      try {
        const result = await toggleOpportunityStatusAction(
          opportunityId,
          currentStatus
        );

        if (result?.ok === false) {
          showToast(result.error || 'Failed to update status', 'error');
        }
      } catch (err) {
        showToast(err.message || 'Failed to update status', 'error');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`text-[10px] font-bold uppercase tracking-tighter ${
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
        aria-label="Toggle Opportunity Status"
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
