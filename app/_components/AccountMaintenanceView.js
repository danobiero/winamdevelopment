'use client';

import { useState, useEffect } from 'react';
import {
  WrenchScrewdriverIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import SignOutButton from './SignOutButton';

export default function AccountMaintenanceView({ config, shareholderName }) {
  const [formattedEndTime, setFormattedEndTime] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const endTimeStr = config?.maintenance_end_time;
  const message =
    config?.maintenance_message ||
    'Our platform is currently undergoing scheduled secure infrastructure and system maintenance.';

  useEffect(() => {
    if (!endTimeStr) {
      setFormattedEndTime('Scheduled Maintenance in Progress');
      setTimeRemaining('In progress');
      return;
    }

    const endTarget = new Date(endTimeStr).getTime();

    // Format local display date
    const d = new Date(endTimeStr);
    if (!isNaN(d.getTime())) {
      setFormattedEndTime(
        d.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZoneName: 'short',
        })
      );
    }

    // Tick countdown
    const updateCountdown = () => {
      const now = Date.now();
      const diff = endTarget - now;

      if (diff <= 0) {
        setTimeRemaining('Maintenance period ending momentarily...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s remaining`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [endTimeStr]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center py-6 sm:py-12 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        {/* Subtle top decorative bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-purple-600 to-blue-600" />

        <div className="text-center space-y-6">
          {/* SECURE MAINTENANCE BADGE & ICON */}
          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                <WrenchScrewdriverIcon className="h-10 w-10 animate-bounce" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1.5 rounded-xl shadow-md">
                <LockClosedIcon className="h-4 w-4" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Secure System Maintenance
            </span>
          </div>

          {/* MAIN MESSAGE */}
          <div className="space-y-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              System Under Maintenance
            </h1>
            {shareholderName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Shareholder Account: <span className="font-bold text-slate-700 dark:text-slate-300">{shareholderName}</span>
              </p>
            )}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              {message}
            </p>
          </div>

          {/* SCHEDULED RESTORATION CARD */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-slate-800/30 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <ClockIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Scheduled Service Restoration
              </div>
              {timeRemaining && (
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                  {timeRemaining}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                The platform will automatically unlock at:
              </div>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono">
                {formattedEndTime || 'Awaiting scheduled completion'}
              </div>
            </div>
          </div>

          {/* SECURITY & DATA PROTECTION ASSURANCES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-start gap-3">
              <ShieldCheckIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                  Assets & Ledgers Protected
                </h4>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                  All member balances, share allocations, and valuation histories remain encrypted and untouched.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  Automatic Restoration
                </h4>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-400/80 mt-0.5">
                  No action is needed on your part. Your account will automatically resume normal operations when the window concludes.
                </p>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Check If System Is Back'}
            </button>

            <div className="w-full sm:w-auto">
              <SignOutButton isMobile={true} />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            If you need urgent assistance, please contact system administration at{' '}
            <a href="mailto:support@winam.com" className="text-blue-600 dark:text-blue-400 hover:underline">
              support@winam.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
