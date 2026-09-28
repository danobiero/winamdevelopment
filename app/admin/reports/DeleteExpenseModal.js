'use client';

import {
  ExclamationTriangleIcon,
  TrashIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const formatUSD = (amount) => {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function DeleteExpenseModal({
  isOpen,
  expense,
  isDeleting,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !expense) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-4 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon Badge */}
        <div className="flex items-center justify-center w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl mx-auto shadow-inner">
          <ExclamationTriangleIcon className="h-7 w-7" />
        </div>

        {/* Text Header */}
        <div className="text-center space-y-1">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Delete Operating Expense?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            This action cannot be undone. This disbursement record will be permanently removed from the ledger and statements.
          </p>
        </div>

        {/* Expense Details Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5 text-rose-500 shrink-0" />
              <span className="font-mono font-black text-rose-700 text-base sm:text-lg">
                {formatUSD(expense.amount)}
              </span>
            </div>
            {expense.category && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200/80 text-slate-700">
                {expense.category}
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium">Vendor / Payee:</span>
              <span className="font-bold text-slate-900">{expense.vendor || '—'}</span>
            </div>

            {expense.description && (
              <div className="flex items-start justify-between gap-2 text-slate-600">
                <span className="text-slate-400 font-medium shrink-0">Memo:</span>
                <span className="text-right truncate max-w-[200px] text-slate-700">
                  {expense.description}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <BuildingOffice2Icon className="h-3.5 w-3.5" />
                <span>Opportunity:</span>
              </span>
              <span className="font-medium text-slate-800 truncate max-w-[180px]">
                {expense.opportunities?.name || `Opportunity #${expense.opportunity_id || 'N/A'}`}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <CalendarDaysIcon className="h-3.5 w-3.5" />
                <span>Expense Date:</span>
              </span>
              <span className="font-mono font-medium text-slate-800">
                {expense.expense_date}
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
                <span>Delete Expense</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
