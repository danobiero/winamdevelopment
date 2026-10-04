'use client';

import { useState, useEffect } from 'react';
import {
  BellAlertIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function MaintenanceAdvanceNoticeModal({
  config,
  hoursUntilStart,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formattedStart, setFormattedStart] = useState('');
  const [formattedEnd, setFormattedEnd] = useState('');

  const startTimeStr = config?.maintenance_start_time;
  const endTimeStr = config?.maintenance_end_time;

  useEffect(() => {
    if (!startTimeStr) return;

    // Check if user already dismissed notice for this specific maintenance schedule in current session
    const storageKey = `winam_maintenance_ack_${startTimeStr}`;
    const alreadyDismissed = sessionStorage.getItem(storageKey);

    if (!alreadyDismissed) {
      setIsOpen(true);
    }

    const s = new Date(startTimeStr);
    if (!isNaN(s.getTime())) {
      setFormattedStart(
        s.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZoneName: 'short',
        })
      );
    }

    if (endTimeStr) {
      const e = new Date(endTimeStr);
      if (!isNaN(e.getTime())) {
        setFormattedEnd(
          e.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short',
          })
        );
      }
    }
  }, [startTimeStr, endTimeStr]);

  const handleDismiss = () => {
    if (startTimeStr) {
      const storageKey = `winam_maintenance_ack_${startTimeStr}`;
      sessionStorage.setItem(storageKey, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-700/60 overflow-hidden transform transition-all scale-100">
        {/* Top decorative gradient bar */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close notification"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
              <BellAlertIcon className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <ExclamationTriangleIcon className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                Scheduled Platform Maintenance
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                System Maintenance Alert
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Please be advised that scheduled system maintenance is approaching in{' '}
            <strong className="text-amber-600 dark:text-amber-400 font-bold">
              {hoursUntilStart ? `less than ${Math.ceil(hoursUntilStart)} hours` : 'the next few hours'}
            </strong>
            . During the maintenance window, account logins and dashboard interactions will be temporarily paused.
          </p>

          {/* Schedule Window Details */}
          <div className="bg-amber-50/70 dark:bg-amber-950/40 rounded-xl p-4 border border-amber-200/70 dark:border-amber-800/50 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-800/40 pb-2">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Maintenance Starts:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formattedStart || 'Scheduled shortly'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Service Restored:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formattedEnd || 'Upon window completion'}
              </span>
            </div>
          </div>

          {/* Advice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
            <strong>Advisory:</strong> We recommend finalizing any active submissions, document reviews, or investment allocations prior to the start time.
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <CheckCircleIcon className="h-4 w-4" />
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
