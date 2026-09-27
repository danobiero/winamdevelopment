'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  getCoreOpportunity,
  createInvestmentSession,
} from '@/app/_lib/actions';

export default function FundingStep({ session, membershipRecord }) {
  const [loadingAmount, setLoadingAmount] = useState(null);
  const [coreDetails, setCoreDetails] = useState(null);

  // Fetch the Core Opportunity details (including minimum_investment) on mount
  useEffect(() => {
    async function loadCore() {
      const data = await getCoreOpportunity();
      if (data) setCoreDetails(data);
    }
    loadCore();
  }, []);

  // Financial Logic
  const current = Number(membershipRecord?.current_shareholding_value || 0);

  // Dynamically use minimum_investment from DB, fallback to 2000 if not yet loaded
  const goal = coreDetails?.minimum_investment
    ? Number(coreDetails.minimum_investment)
    : 2000;

  const progress = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);

  const handlePay = async (amount) => {
    try {
      setLoadingAmount(amount);

      // STEP 1: Use the ID we already fetched or fetch fresh if needed
      const targetId = coreDetails?.id || (await getCoreOpportunity())?.id;

      if (!targetId)
        throw new Error('The Core Portfolio is currently unavailable.');

      // STEP 2: Process the payment
      const result = await createInvestmentSession(targetId, amount);

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Funding Error:', err);
      alert(err.message || 'An unexpected error occurred.');
    } finally {
      setLoadingAmount(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-20 p-12 bg-white border border-slate-200 rounded-3xl text-center shadow-xl">
      <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircleIcon className="h-10 w-10 text-emerald-600" />
      </div>

      <h2 className="text-3xl font-black text-primary-950 mb-4">
        Funding Your Shareholding
      </h2>
      <p className="text-slate-600 leading-relaxed mb-8">
        Contribute toward your minimum <strong>${goal.toLocaleString()}</strong>{' '}
        core position to unlock the full Winam Ecosystem.
      </p>

      {/* Progress Visualization */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 mb-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Funding Progress
          </span>
          <span className="text-lg font-black text-primary-600">
            {progress.toFixed(0)}%
          </span>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-4 mb-6 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">
              Funded
            </p>
            <p className="text-xl font-black text-slate-900">
              ${current.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase mb-1">
              Target
            </p>
            <p className="text-xl font-black text-slate-900">
              ${goal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Contribution Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[100, 200, 500].map((val) => (
          <button
            key={val}
            onClick={() => handlePay(val)}
            disabled={loadingAmount !== null || !coreDetails}
            className={`
              relative flex flex-col items-center justify-center py-5 rounded-2xl font-black transition-all
              ${
                loadingAmount === val
                  ? 'bg-slate-100 text-slate-400'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:scale-95 shadow-md'
              }
              disabled:opacity-50
            `}
          >
            {loadingAmount === val ? (
              <ArrowPathIcon className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <span className="text-xs opacity-80 mb-1 uppercase tracking-tighter text-white">
                  Invest
                </span>
                <span className="text-2xl">${val}</span>
              </>
            )}
          </button>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-100">
        <div className="inline-block px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
          Step 6 of 7
        </div>
      </div>
    </div>
  );
}
