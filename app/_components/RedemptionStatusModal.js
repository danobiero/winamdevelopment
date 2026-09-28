'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import { FormatCurrency } from '../_lib/utils';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function RedemptionStatusModal({ investment, onClose }) {
  const redemption = investment.redemption_requests?.[0];

  if (!redemption) return null;

  const badgeStyle = STATUS_STYLES[redemption.status] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Redemption Status
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
              Opportunity
            </label>
            <p className="text-sm font-bold text-slate-800">
              {investment.opportunities?.name}
            </p>
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 min-w-0">
            <div className="min-w-0 overflow-hidden">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
                Requested Amount
              </label>
              <p className="text-xl sm:text-2xl font-black text-blue-900 tracking-tight break-all sm:break-words">
                {FormatCurrency(redemption.amount)}
              </p>
            </div>
            <div className="min-w-0 overflow-hidden">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
                Status
              </label>
              <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-md border tracking-wider mt-1 ${badgeStyle}`}>
                {redemption.status}
              </span>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden">
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
              Processed So Far
            </label>
            <p className="text-base sm:text-lg font-bold text-slate-800 tracking-tight break-all sm:break-words">
              {FormatCurrency(redemption.already_redeemed_so_far || 0)}
            </p>
          </div>

          {redemption.admin_notes && (
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
                Administrator Notes
              </label>
              <div className="p-4 bg-slate-50 rounded-2xl text-xs font-semibold text-slate-600 border border-slate-100 leading-relaxed">
                {redemption.admin_notes}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
              Submission Date
            </label>
            <p className="text-xs font-bold text-slate-500">
              {new Date(redemption.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
