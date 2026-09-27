'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  getCoreInvestmentProgress,
  createCheckoutSessionForInvestment,
} from '@/app/_lib/actions';

export const dynamic = 'force-dynamic';

export default function FundingStep({ session }) {
  const [loadingAmount, setLoadingAmount] = useState(null);
  const [fundingData, setFundingData] = useState(null);

  useEffect(() => {
    async function load() {
      if (!session?.user?.shareholderId) return;
      const data = await getCoreInvestmentProgress(session.user.shareholderId);
      if (data) setFundingData(data);
    }
    load();
  }, [session?.user?.shareholderId]);

  const current = Number(fundingData?.current || 0);
  const goal = Number(fundingData?.goal || 2000);

  const progress = Math.min((current / goal) * 100, 100);
  const remaining = Math.max(goal - current, 0);
  const isGoalReached = progress >= 100;

  const standardOptions = [200, 500, 1000, 2000];
  const dynamicOptions = standardOptions.filter((val) => val < remaining);

  if (remaining > 0 && !dynamicOptions.includes(remaining)) {
    dynamicOptions.push(remaining);
  }
  dynamicOptions.sort((a, b) => a - b);

  const handlePay = async (amount) => {
    try {
      setLoadingAmount(amount);
      const targetId = fundingData?.id;
      if (!targetId)
        throw new Error('The Core Portfolio is currently unavailable.');

      const result = await createCheckoutSessionForInvestment(
        targetId,
        amount,
        session.user.email,
        session.user.shareholderId
      );

      if (result?.url) window.location.href = result.url;
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
          {/* FUNDED CARD */}
          <div
            className={`p-3 rounded-xl border transition-colors duration-500 shadow-sm ${
              isGoalReached
                ? 'bg-emerald-600 border-emerald-700'
                : 'bg-white border-slate-100'
            }`}
          >
            <p
              className={`text-xs font-bold uppercase mb-1 ${
                isGoalReached ? 'text-emerald-100' : 'text-slate-400'
              }`}
            >
              Funded
            </p>
            <p
              className={`text-xl font-black ${
                isGoalReached ? 'text-white' : 'text-slate-900'
              }`}
            >
              ${current.toLocaleString()}
            </p>
          </div>

          {/* TARGET CARD */}
          <div
            className={`p-3 rounded-xl border transition-colors duration-500 shadow-sm ${
              isGoalReached
                ? 'bg-emerald-600 border-emerald-700'
                : 'bg-white border-slate-100'
            }`}
          >
            <p
              className={`text-xs font-bold uppercase mb-1 ${
                isGoalReached ? 'text-emerald-100' : 'text-slate-400'
              }`}
            >
              Target
            </p>
            <p
              className={`text-xl font-black ${
                isGoalReached ? 'text-white' : 'text-slate-900'
              }`}
            >
              ${goal.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Contribution Buttons - Hidden when goal is reached */}
      {!isGoalReached && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {dynamicOptions.map((val) => (
            <button
              key={val}
              onClick={() => handlePay(val)}
              disabled={loadingAmount !== null || !fundingData}
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
                  <span className="text-2xl">${val.toLocaleString()}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-slate-100">
        <div className="inline-block px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-500 uppercase tracking-widest">
          Step 6 of 7
        </div>
      </div>
    </div>
  );
}
