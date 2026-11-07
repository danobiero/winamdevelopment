'use client';

import {
  ExclamationTriangleIcon,
  TrashIcon,
  CreditCardIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  UserIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const formatUSD = (amount) => {
  return `$${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function DeletePaymentModal({
  isOpen,
  payment,
  isDeleting,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !payment) return null;

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
            Delete Payment Record?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            This action cannot be undone. This payment record will be permanently removed from the ledger and statements.
          </p>
        </div>

        {/* Payment Details Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-mono font-black text-emerald-700 text-base sm:text-lg">
                {formatUSD(payment.amount)}
              </span>
            </div>
            {payment.status && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-slate-200/80 text-slate-700">
                {payment.status}
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" />
                <span>Shareholder:</span>
              </span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                {payment.shareholders?.fullName || 'Anonymous Investor'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <BuildingOffice2Icon className="h-3.5 w-3.5" />
                <span>Opportunity:</span>
              </span>
              <span className="font-medium text-slate-800 truncate max-w-[180px]">
                {payment.opportunities?.name || `Opportunity #${payment.opportunity_id || 'N/A'}`}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <CalendarDaysIcon className="h-3.5 w-3.5" />
                <span>Date:</span>
              </span>
              <span className="font-mono font-medium text-slate-800">
                {payment.created_at ? payment.created_at.split('T')[0] : '—'}
              </span>
            </div>

            {payment.payment_method_type && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-400 font-medium">Method / Rail:</span>
                <span className="font-mono uppercase font-bold text-slate-700">
                  {payment.metadata?.payout_rail || payment.payment_method_type}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-rose-600/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <TrashIcon className="h-4 w-4" />
                <span>Yes, Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
