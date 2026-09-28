'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { FormatCurrency } from '../_lib/utils';
import { getInvestorLedger } from '../_lib/actions';

function LedgerModal({ shareholderId, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * -------------------------------------------------------------
   * FETCH LEDGER (SERVER ACTION)
   * -------------------------------------------------------------
   */
  useEffect(() => {
    async function loadLedger() {
      try {
        const rows = await getInvestorLedger(shareholderId);
        setData(rows || []);
      } catch (err) {
        console.error('Ledger load failed:', err);
      } finally {
        setLoading(false);
      }
    }

    if (shareholderId) loadLedger();
  }, [shareholderId]);

  /**
   * -------------------------------------------------------------
   * RENDER
   * -------------------------------------------------------------
   */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 md:p-6">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-xl p-4 sm:p-6 max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-blue-950">
            Transaction Ledger
          </h2>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-slate-100 transition cursor-pointer"
          >
            <XMarkIcon className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="text-center py-10 text-slate-500">
            Loading transactions...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] border border-slate-200 rounded-xl flex-1">
            <table className="min-w-full text-sm">
              {/* HEADER */}
              <thead className="bg-slate-100 text-xs uppercase text-slate-600 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Opportunity</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>
                {data.map((tx) => {
                  const rawAmount = Number(tx.amount);
                  const safeAmount = isNaN(rawAmount) ? 0 : Math.abs(rawAmount);
                  const isPositive = rawAmount > 0;

                  return (
                    <tr
                      key={tx.transaction_id}
                      className="border-t border-slate-200 hover:bg-slate-50 transition"
                    >
                      {/* DATE */}
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(tx.transaction_date).toLocaleDateString()}
                      </td>

                      {/* TYPE */}
                      <td className="px-4 py-3 font-bold text-blue-950 whitespace-nowrap">
                        {tx.source}
                      </td>

                      {/* OPPORTUNITY */}
                      <td className="px-4 py-3 text-slate-700">
                        {tx.opportunity_name || '—'}
                      </td>

                      {/* DESCRIPTION */}
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {tx.description || '—'}
                      </td>

                      {/* AMOUNT (FIXED) */}
                      <td
                        className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                          isPositive ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {isPositive ? '+' : '-'}
                        {FormatCurrency(safeAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-950 text-white text-xs font-black uppercase rounded-lg hover:bg-blue-900 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default LedgerModal;
