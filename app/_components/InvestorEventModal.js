'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO, isValid, isBefore, isAfter } from 'date-fns';
import {
  CalendarDaysIcon,
  ClockIcon,
  VideoCameraIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function EventModal({ events = [], date, onClose }) {
  // We use a state for 'now' to ensure the component re-renders if a meeting
  // ends while the modal is open, and to avoid hydration mismatch.
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  if (!date) return null;

  // Helper to parse various time formats (ISO strings or '10:08 PM')
  const getEventDate = (timeValue) => {
    if (!timeValue) return null;
    const parsed =
      typeof timeValue === 'string' ? parseISO(timeValue) : new Date(timeValue);
    return isValid(parsed) ? parsed : null;
  };

  const formatTimeLabel = (timeValue) => {
    const d = getEventDate(timeValue);
    return d ? format(d, 'h:mm a') : timeValue;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl">
              <CalendarDaysIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {format(date, 'EEEE, MMM do')}
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Schedule Overview
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          {events.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                No meetings scheduled.
              </p>
            </div>
          ) : (
            events.map((event) => {
              const startDt = getEventDate(event.start_time || event.time);
              const endDt = getEventDate(event.endTime || event.end_time);

              const isPast = endDt ? isBefore(endDt, now) : false;
              const isLive =
                startDt &&
                endDt &&
                isAfter(now, startDt) &&
                isBefore(now, endDt);

              return (
                <div
                  key={event.id}
                  className={`relative group p-4 border rounded-2xl transition-all duration-200 ${
                    isPast
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : isLive
                        ? 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-800 shadow-md ring-1 ring-green-100 dark:ring-green-900/30'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-indigo-600 hover:shadow-sm'
                  }`}
                >
                  {/* LIVE INDICATOR */}
                  {isLive && (
                    <div className="absolute -top-2 -right-2 flex items-center gap-1.5 bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter animate-pulse">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-100"></span>
                      </span>
                      Live Now
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <h3
                        className={`font-bold leading-snug ${isPast ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}
                      >
                        {event.title || 'Untitled Event'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <ClockIcon className="h-4 w-4" />
                        <span>
                          {formatTimeLabel(event.start_time || event.time)}
                          {endDt && ` — ${formatTimeLabel(endDt)}`}
                        </span>
                      </div>
                    </div>

                    {isPast && (
                      <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                        <CheckCircleIcon className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase">
                          Ended
                        </span>
                      </div>
                    )}
                  </div>

                  {event.opportunity && !isPast && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-4">
                      {event.opportunity}
                    </p>
                  )}

                  {/* ACTION BUTTON */}
                  {event.meetLink &&
                    (isPast ? (
                      <div className="w-full py-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold text-center border border-slate-200 dark:border-slate-700 italic">
                        Meeting has concluded
                      </div>
                    ) : (
                      <a
                        href={event.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                          isLive
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100'
                            : 'bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white'
                        }`}
                      >
                        <VideoCameraIcon className="h-4 w-4" />
                        {isLive ? 'Join Ongoing Meeting' : 'Join Meeting'}
                      </a>
                    ))}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 text-sm font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
