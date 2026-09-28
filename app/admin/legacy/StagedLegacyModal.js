'use client';

import { useState } from 'react';
import LegacyTable from './LegacyTable';
import { UserGroupIcon, XMarkIcon } from '@heroicons/react/24/solid';

export default function StagedLegacyModal({ records = [], opportunities = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  const claimedCount = records.filter((r) => r.is_claimed).length;
  const pendingCount = records.length - claimedCount;

  return (
    <>
      {/* Trigger Button next to PENDING and LIVE & CLAIMED */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
      >
        <UserGroupIcon className="h-4 w-4 text-blue-200" />
        <span>Staged Shareholders</span>
        <span className="px-2 py-0.5 bg-blue-700/80 rounded-full text-xs font-mono font-black">
          {records.length}
        </span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 lg:p-6 overflow-y-auto"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-slate-50 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-7xl my-4 sm:my-6 flex flex-col border border-slate-200 max-h-[92vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-white px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <UserGroupIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-black text-[#000033] uppercase tracking-tight">
                        Staged Legacy Shareholders
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                        {records.length} Total
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">
                      Pre-platform records waiting for or already linked to Google sign-in
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold">
                    Pending: {pendingCount}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold">
                    Live: {claimedCount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <LegacyTable
                records={records}
                opportunities={opportunities}
                showHeader={false}
              />
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-5 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span className="font-medium">
                Showing {records.length} staged shareholder record{records.length === 1 ? '' : 's'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
