'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUnpaidApplicationAction } from './membership-actions';
import { useToast } from '@/app/_lib/ToastContext';

export default function DeleteApplicationButton({
  application,
  variant = 'desktop',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  if (!application || application.application_fee_paid) return null;

  const handleConfirmDelete = () => {
    startTransition(async () => {
      try {
        const result = await deleteUnpaidApplicationAction(application.id);

        if (result?.error) {
          showToast?.(
            result.message || 'Failed to delete unpaid application.',
            'error'
          );
          return;
        }

        showToast?.(
          result?.message || 'Unpaid application deleted successfully.',
          'success'
        );
        setIsOpen(false);
        router.refresh();
      } catch (err) {
        console.error('Error deleting application:', err);
        showToast?.(
          err.message || 'An unexpected error occurred.',
          'error'
        );
      }
    });
  };

  const buttonClasses =
    variant === 'mobile'
      ? 'px-3 py-2 bg-red-600 hover:bg-red-700 border border-red-700 text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors cursor-pointer'
      : 'bg-red-600 hover:bg-red-700 border border-red-700 text-white px-2 py-1 rounded text-xs font-black uppercase shadow-sm transition-colors cursor-pointer';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={buttonClasses}
      >
        Delete
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
          onClick={() => !isPending && setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-left animate-in fade-in zoom-in duration-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-black text-lg text-slate-900">
                  Delete Unpaid Application?
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Application #{String(application.id).slice(0, 8)}
                </p>
              </div>
              <span className="px-2 py-0.5 rounded border text-xs font-black uppercase text-red-500 bg-slate-50 border-slate-200">
                Unpaid
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider">
                  Applicant:
                </span>
                <span className="font-bold text-slate-900 text-right">
                  {application.full_name}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider">
                  Email:
                </span>
                <span className="font-medium text-blue-600 text-right break-all">
                  {application.email}
                </span>
              </div>
              {application.phone && (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">
                    Phone:
                  </span>
                  <span className="font-medium text-slate-700 text-right">
                    {application.phone}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider">
                  Status:
                </span>
                <span className="font-black uppercase text-slate-700 text-right">
                  {application.status || 'applied'}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently remove this unpaid application?{' '}
              <span className="text-red-600 font-semibold">
                This action cannot be undone.
              </span>
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-xs font-bold uppercase tracking-wider bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    <span>Deleting…</span>
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
