'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePaymentModeAction } from './payment-actions';
import {
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/solid';

export default function PaymentModeToggle({ initialMode = 'manual' }) {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState(initialMode);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState('');

  const handleToggle = (newMode) => {
    if (newMode === currentMode || isPending) return;

    startTransition(async () => {
      try {
        await updatePaymentModeAction(newMode);
        setCurrentMode(newMode);
        router.refresh();
        setToastMessage(
          newMode === 'stripe'
            ? 'Stripe automated checkout is now active.'
            : 'Zelle & Cash App manual payments are now active.'
        );
        setTimeout(() => setToastMessage(''), 4000);
      } catch (err) {
        alert(err.message || 'Failed to update payment mode');
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Active Status */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Payment Gateway Mode
            </span>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                currentMode === 'stripe'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  currentMode === 'stripe' ? 'bg-blue-600' : 'bg-emerald-600'
                }`}
              />
              {currentMode === 'stripe' ? 'Stripe Active' : 'Zelle / Cash App Active'}
            </span>
            {isPending && (
              <ArrowPathIcon className="h-4 w-4 text-slate-400 animate-spin" />
            )}
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Choose whether investors pay automatically via Stripe or send manual payments via Zelle / Cash App.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 self-start md:self-auto">
          {/* Manual (Zelle / Cash App) Option */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleToggle('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              currentMode === 'manual'
                ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BanknotesIcon className="h-4 w-4 text-emerald-600" />
            <span>Zelle / Cash App</span>
            {currentMode === 'manual' && (
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
            )}
          </button>

          {/* Stripe Option */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleToggle('stripe')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              currentMode === 'stripe'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCardIcon className="h-4 w-4 text-blue-600" />
            <span>Stripe Checkout</span>
            {currentMode === 'stripe' && (
              <CheckCircleIcon className="h-4 w-4 text-blue-600" />
            )}
          </button>
        </div>
      </div>

      {/* Details Box for Active Mode */}
      {currentMode === 'manual' ? (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl">
          <div>
            <span className="text-slate-400 font-medium block">Designated Payee</span>
            <span className="font-bold text-slate-800">Winam Development Group</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Cash App Handle</span>
            <span className="font-bold text-emerald-700 font-mono">$Winam (346-314-3469)</span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Zelle Recipient</span>
            <span className="font-bold text-slate-800 font-mono">
              346-314-3469 <br />
              <span className="text-xs text-slate-600 font-sans">winamdevelopmentgroup@gmail.com</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-blue-700 bg-blue-50/50 p-3 rounded-xl flex items-center gap-2">
          <CreditCardIcon className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <span>
            Stripe mode is active. Investors are redirected directly to Stripe Checkout for credit/debit card processing.
          </span>
        </div>
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="mt-3 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in">
          ✓ {toastMessage}
        </div>
      )}
    </div>
  );
}
