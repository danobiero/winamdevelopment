'use client';

import { useState } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { FormatCurrency } from '../_lib/utils';

export default function RedemptionModal({
  investment,
  onClose,
  onSubmit,
  isWorking,
}) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onSubmit(investment.id, { reason });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            Request Redemption
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
          {/* Warning Banner */}
          <div className="mb-6 sm:mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Redemption requests are subject to operating agreement contracts.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
                Asset
              </label>
              <p className="text-sm font-bold text-slate-800">
                {investment.opportunities?.name}
              </p>
            </div>

            <div className="min-w-0 overflow-hidden">
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
                Redemption Value
              </label>
              <p className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight break-all sm:break-words">
                {FormatCurrency(investment.amount_invested)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-wider">
                Reason for Request
              </label>
              <textarea
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none"
                rows="3"
                placeholder="Briefly describe the reason for withdrawal..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 sm:mt-10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3.5 sm:py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-100 transition-colors text-xs sm:text-sm uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isWorking || !reason.trim()}
              className="flex-1 px-4 py-3.5 sm:py-4 rounded-2xl font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-200 transition-all shadow-xl shadow-red-200 text-xs sm:text-sm uppercase tracking-wider"
            >
              {isWorking ? 'Processing...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
