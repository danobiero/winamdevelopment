'use client';

import {
  ExclamationTriangleIcon,
  TrashIcon,
  DocumentIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function DeleteReportModal({
  isOpen,
  report,
  isDeleting,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !report) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col space-y-4 sm:space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Badge */}
        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-rose-100 text-rose-600 rounded-2xl mx-auto shadow-inner">
          <ExclamationTriangleIcon className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>

        {/* Text Header */}
        <div className="text-center space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Delete Meeting Report?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            This action cannot be undone. The file will be permanently removed from Supabase storage and unlinked from the opportunity.
          </p>
        </div>

        {/* Report Preview Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 space-y-2.5 text-left">
          <div className="flex items-start gap-2.5">
            <DocumentIcon className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
                Document Title
              </span>
              <p className="text-xs font-bold text-slate-800 break-words leading-snug">
                {report.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
              <BuildingOffice2Icon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-medium truncate" title={report.opportunities?.name}>
                {report.opportunities?.name || 'Opportunity'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 justify-end">
              <CalendarDaysIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-mono font-medium">
                {report.meetingDate}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                <span>Delete Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
