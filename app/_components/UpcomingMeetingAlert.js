'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { isToday, isTomorrow, format } from 'date-fns';
import {
  CalendarDaysIcon,
  VideoCameraIcon,
  ClockIcon,
  BellAlertIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/solid';

export default function UpcomingMeetingAlert({ meetings = [] }) {
  const [now, setNow] = useState(null);
  const [dismissedBannerIds, setDismissedBannerIds] = useState([]);
  const [popupMeeting, setPopupMeeting] = useState(null);

  // Initialize client clock and refresh every minute
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Filter meetings to those occurring TODAY (and not yet ended) or TOMORROW in local browser timezone
  const activeAlerts = useMemo(() => {
    if (!now || !Array.isArray(meetings) || meetings.length === 0) return [];

    return meetings
      .map((m) => {
        const start = new Date(m.start_time);
        if (isNaN(start.getTime())) return null;

        const end = m.end_time
          ? new Date(m.end_time)
          : new Date(start.getTime() + 60 * 60 * 1000);

        // Skip meetings that have already ended
        if (now > end) return null;

        const meetingIsToday = isToday(start);
        const meetingIsTomorrow = isTomorrow(start);

        if (!meetingIsToday && !meetingIsTomorrow) return null;

        const isLiveNow = now >= start && now <= end;

        return {
          ...m,
          start,
          end,
          isToday: meetingIsToday,
          isTomorrow: meetingIsTomorrow,
          isLiveNow,
          dayLabel: isLiveNow
            ? 'Live Now'
            : meetingIsToday
              ? 'Today'
              : 'Tomorrow',
          timeWindow: `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`,
          dateFormatted: format(start, 'EEE, MMM d'),
        };
      })
      .filter(Boolean)
      .filter((m) => !dismissedBannerIds.includes(m.id));
  }, [meetings, now, dismissedBannerIds]);

  // Trigger a one-time session popup for the soonest Today/Tomorrow meeting on login
  useEffect(() => {
    if (activeAlerts.length === 0) {
      setPopupMeeting(null);
      return;
    }

    const nextMeeting = activeAlerts[0];
    const storageKey = `winam_meeting_popup_ack_${nextMeeting.id}`;
    try {
      const alreadyAcked = sessionStorage.getItem(storageKey);
      if (!alreadyAcked) {
        setPopupMeeting(nextMeeting);
      }
    } catch (e) {
      // ignore storage errors
    }
  }, [activeAlerts]);

  const handleAckPopup = () => {
    if (popupMeeting) {
      try {
        sessionStorage.setItem(
          `winam_meeting_popup_ack_${popupMeeting.id}`,
          'true'
        );
      } catch (e) {}
    }
    setPopupMeeting(null);
  };

  const handleDismissBanner = (id) => {
    setDismissedBannerIds((prev) => [...prev, id]);
  };

  if (activeAlerts.length === 0) return null;

  return (
    <>
      {/* TOP PERSISTENT MEETING ALERT BANNER */}
      <div className="space-y-2.5 mb-3 shrink-0">
        {activeAlerts.map((meeting) => {
          const isTodayOrLive = meeting.isToday || meeting.isLiveNow;

          return (
            <div
              key={meeting.id}
              className={`rounded-2xl p-3.5 sm:p-4 border shadow-sm transition-all relative overflow-hidden ${
                meeting.isLiveNow
                  ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/90 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-emerald-950/60 border-emerald-300 dark:border-emerald-700'
                  : isTodayOrLive
                    ? 'bg-gradient-to-r from-blue-50 via-indigo-50/80 to-blue-50 dark:from-blue-950/60 dark:via-indigo-950/40 dark:to-blue-950/60 border-blue-200 dark:border-blue-800'
                    : 'bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 border-amber-200 dark:border-amber-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      meeting.isLiveNow
                        ? 'bg-emerald-600 text-white'
                        : isTodayOrLive
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-500 text-white'
                    }`}
                  >
                    <BellAlertIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          meeting.isLiveNow
                            ? 'bg-emerald-600 text-white'
                            : isTodayOrLive
                              ? 'bg-blue-600 text-white'
                              : 'bg-amber-200/90 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                        }`}
                      >
                        {meeting.isLiveNow && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        )}
                        {meeting.isLiveNow
                          ? 'Session Live Now'
                          : meeting.isToday
                            ? 'Meeting Today'
                            : 'Meeting Tomorrow'}
                      </span>

                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                        {meeting.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-100">
                        <ClockIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        {meeting.dayLabel} ({meeting.dateFormatted}) •{' '}
                        {meeting.timeWindow}
                      </span>
                      <span>
                        — Shareholder briefing scheduled for your investment
                        portfolio.
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {meeting.meet_link && (
                    <a
                      href={meeting.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-all active:scale-95 inline-flex items-center gap-1.5"
                    >
                      <VideoCameraIcon className="h-4 w-4" />
                      <span>Join Meeting</span>
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                    </a>
                  )}

                  <Link
                    href="/account/calendar"
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-black uppercase tracking-wider shadow-2xs transition-all inline-flex items-center gap-1.5"
                  >
                    <CalendarDaysIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Schedule</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDismissBanner(meeting.id)}
                    aria-label="Dismiss meeting alert"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ONE-TIME LOGIN NOTIFICATION POPUP MODAL */}
      {popupMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-blue-200 dark:border-blue-800 overflow-hidden">
            <div
              className={`h-2 ${
                popupMeeting.isToday
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-blue-600'
              }`}
            />

            <button
              type="button"
              onClick={handleAckPopup}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${
                    popupMeeting.isToday
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                      : 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <BellAlertIcon className="h-7 w-7" />
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      popupMeeting.isToday
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    }`}
                  >
                    {popupMeeting.isLiveNow
                      ? 'Happening Right Now'
                      : popupMeeting.isToday
                        ? 'Upcoming Meeting Today'
                        : 'Upcoming Meeting Tomorrow'}
                  </span>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mt-1">
                    {popupMeeting.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">
                    Date
                  </span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {popupMeeting.dayLabel} ({popupMeeting.dateFormatted})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">
                    Time Window
                  </span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {popupMeeting.timeWindow}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
                {popupMeeting.meet_link && (
                  <a
                    href={popupMeeting.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleAckPopup}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <VideoCameraIcon className="h-4 w-4" />
                    <span>Join Google Meet</span>
                  </a>
                )}

                <Link
                  href="/account/calendar"
                  onClick={handleAckPopup}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-md"
                >
                  <CalendarDaysIcon className="h-4 w-4" />
                  <span>View Schedule</span>
                </Link>

                <button
                  type="button"
                  onClick={handleAckPopup}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
