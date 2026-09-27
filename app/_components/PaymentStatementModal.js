'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  XMarkIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { FormatCurrency } from '../_lib/utils';
import {
  getCurrentInvestorInfo,
  getSettings,
  getLedgerStatements,
} from '../_lib/actions';
import PDFDownloadButton from './PDFDownloadButton';

function PaymentStatementModal({ opportunityId, opportunityName, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [investor, setInvestor] = useState(null);
  const [settings, setSettings] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        const [payments, investorInfo, settingsData] = await Promise.all([
          getLedgerStatements(opportunityId),
          getCurrentInvestorInfo(),
          getSettings(),
        ]);

        setData(payments || []);
        setInvestor(investorInfo);
        setSettings(settingsData);
      } catch (err) {
        console.error('Load failed:', err);
      } finally {
        setLoading(false);
      }
    }

    if (opportunityId) loadAll();
  }, [opportunityId]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Only count confirmed / succeeded payments towards total received
  const totalPaid = data
    .filter((tx) => tx.status !== 'failed' && tx.status !== 'cancelled')
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const failedCount = data.filter((tx) => tx.status === 'failed').length;
  const lastPayment = data.length > 0 ? data[0].transaction_date : null;

  if (!mounted) return null;

  const modalContent = (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-white w-full max-w-5xl h-[94vh] sm:h-[86vh] max-h-[94vh] sm:max-h-[86vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 min-h-0">
        {/* MOBILE TOP BAR (ALWAYS PINNED & VISIBLE ON MOBILE) */}
        <div className="flex lg:hidden justify-between items-center px-4 py-3 bg-white border-b border-slate-200 shrink-0 z-20">
          <div className="min-w-0 pr-2">
            <h2 className="text-base font-black text-blue-950 leading-tight truncate">
              Payment Statement
            </h2>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest truncate">
              {opportunityName || 'Investment'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-4 w-4" />
            <span>Close</span>
          </button>
        </div>

        {/* MAIN BODY: SIDEBAR + CONTENT */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* LEFT SIDEBAR: QUICK LOOK */}
          <div className="w-full lg:w-72 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 p-3 sm:p-5 lg:p-7 flex flex-col shrink-0">
            {/* DESKTOP SIDEBAR HEADER */}
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-black text-blue-950 leading-tight truncate">
                Payment Statement
              </h2>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1 truncate">
                {opportunityName || 'Investment'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 sm:gap-3 lg:gap-4 flex-grow">
              <div className="col-span-2 sm:col-span-1 lg:col-auto bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xs border border-slate-200/80 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 tracking-tight">
                  Total Credited
                </p>
                <p className="text-base sm:text-lg lg:text-2xl font-black text-blue-950 tracking-tight truncate">
                  {FormatCurrency(totalPaid)}
                </p>
              </div>

              <div className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-2xs border border-slate-200/80 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 tracking-tight truncate">
                  Transactions
                </p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-slate-800 truncate">
                  {data.length} Total
                </p>
              </div>

              {failedCount > 0 && (
                <div className="bg-rose-50 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-rose-200 min-w-0">
                  <p className="text-[9px] sm:text-[10px] font-bold text-rose-600 uppercase mb-0.5 tracking-tight truncate">
                    Unreconciled / Failed
                  </p>
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-rose-900 truncate">
                    {failedCount} Payment{failedCount === 1 ? '' : 's'}
                  </p>
                </div>
              )}

              <div className="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl shadow-2xs border border-slate-200/80 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-0.5 tracking-tight truncate">
                  Last Activity
                </p>
                <p className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">
                  {lastPayment
                    ? new Date(lastPayment).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="hidden lg:block mt-auto pt-6">
              <div className="flex items-center gap-2.5 p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100/60">
                <InformationCircleIcon className="h-4 w-4 text-blue-600 shrink-0" />
                <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                  Showing all recorded payments and reconciliation status for this position.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: TABLE CONTENT */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white overflow-hidden">
            {/* DESKTOP TABLE HEADER */}
            <div className="p-3 sm:p-4 lg:p-6 pb-2 sm:pb-3 flex justify-between items-center shrink-0 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-blue-950">
                  Transaction History
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                  Detailed logs of your payments and reconciliation status
                </p>
              </div>
              {/* DESKTOP CLOSE BUTTON */}
              <button
                type="button"
                onClick={onClose}
                className="hidden lg:flex items-center justify-center p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-blue-950 rounded-full transition-all group shrink-0 cursor-pointer shadow-2xs"
                aria-label="Close modal"
                title="Close modal"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 lg:px-7">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 sm:h-64">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Syncing payment records...
                  </p>
                </div>
              ) : data.length === 0 ? (
                <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6">
                  <BanknotesIcon className="h-12 w-12 sm:h-16 sm:w-16 text-slate-200 mb-4" />
                  <h3 className="text-base sm:text-lg font-bold text-slate-800">
                    No payments found
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Transactions will appear here once processed.
                  </p>
                </div>
              ) : (
                <div className="w-full min-w-0">
                  <table className="w-full text-left table-auto">
                    <thead className="sticky top-0 bg-white z-10 border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 pl-0.5 sm:pl-1 whitespace-nowrap w-24 sm:w-36">
                          Date
                        </th>
                        <th className="py-2.5 sm:py-3 text-left text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 px-2 sm:px-3">
                          Description & Details
                        </th>
                        <th className="py-2.5 sm:py-3 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 px-2 whitespace-nowrap w-24">
                          Status
                        </th>
                        <th className="py-2.5 sm:py-3 text-right text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 pr-0.5 sm:pr-1 whitespace-nowrap w-24 sm:w-32">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.map((tx) => {
                        const isFailed = tx.status === 'failed';
                        const isSucceeded = tx.status === 'succeeded' || tx.status === 'paid' || tx.status === 'complete';

                        return (
                          <tr
                            key={tx.transaction_id}
                            className={`group hover:bg-slate-50/70 transition-colors ${
                              isFailed ? 'bg-rose-50/20' : ''
                            }`}
                          >
                            {/* DATE */}
                            <td className="py-2.5 sm:py-3.5 pl-0.5 sm:pl-1 whitespace-nowrap align-middle">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className="p-1 bg-slate-50 border border-slate-100 rounded-lg group-hover:border-blue-200 group-hover:bg-blue-50/50 transition-colors shrink-0">
                                  <CalendarDaysIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
                                </div>
                                <span className="text-[11px] sm:text-xs font-bold text-slate-700">
                                  {new Date(tx.transaction_date).toLocaleDateString()}
                                </span>
                              </div>
                            </td>

                            {/* DESCRIPTION & CATEGORY */}
                            <td className="py-2.5 sm:py-3.5 px-2 sm:px-3 min-w-0 align-middle">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={`text-xs sm:text-sm font-bold break-words ${isFailed ? 'text-slate-700' : 'text-slate-900'}`}>
                                  {tx.line_item_name || 'Investment Payment'}
                                </p>
                                {tx.receipt_url && (
                                  <a
                                    href={tx.receipt_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 transition-colors shrink-0 inline-flex items-center gap-0.5 text-[9px] font-semibold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100"
                                    title="View Receipt"
                                  >
                                    <span>Receipt</span>
                                    <ArrowTopRightOnSquareIcon className="h-2.5 w-2.5" />
                                  </a>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                <span className="text-[8px] sm:text-[9px] font-extrabold text-slate-500 bg-slate-100 px-1 py-0.5 rounded uppercase tracking-wider">
                                  {tx.ledger_category}
                                </span>
                                <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono">
                                  #{tx.transaction_id?.slice(0, 8)}
                                </span>
                              </div>

                              {/* FAILURE REASON CALLOUT (If marked failed by admin) */}
                              {isFailed && (
                                <div className="mt-1.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] leading-tight flex items-start gap-1.5">
                                  <ExclamationTriangleIcon className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="uppercase text-[9px] tracking-wider text-rose-700 block">
                                      Reconciliation Notice:
                                    </strong>
                                    <span>{tx.failure_reason || 'Payment could not be reconciled by administrator'}</span>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* STATUS BADGE */}
                            <td className="py-2.5 sm:py-3.5 px-2 text-center whitespace-nowrap align-middle">
                              {isSucceeded && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Credited
                                </span>
                              )}
                              {isFailed && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                  Unreconciled
                                </span>
                              )}
                              {!isSucceeded && !isFailed && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                  Pending
                                </span>
                              )}
                            </td>

                            {/* AMOUNT */}
                            <td className="py-2.5 sm:py-3.5 pr-0.5 sm:pr-1 text-right whitespace-nowrap align-middle">
                              {isFailed ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-xs sm:text-sm font-semibold line-through text-slate-400">
                                    {FormatCurrency(Number(tx.amount))}
                                  </span>
                                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">
                                    Not Credited
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs sm:text-sm lg:text-base font-black text-blue-950">
                                  {FormatCurrency(Number(tx.amount))}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PERSISTENT FOOTER (ALWAYS PINNED AT BOTTOM ON ALL SCREENS) */}
        <div className="p-3 sm:p-4 lg:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2.5 sm:gap-4 shrink-0 shadow-sm z-20">
          <div className="w-full sm:w-auto flex justify-center sm:justify-start">
            <PDFDownloadButton
              data={data}
              opportunityName={opportunityName}
              investor={investor}
              settings={settings}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer"
          >
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default PaymentStatementModal;
