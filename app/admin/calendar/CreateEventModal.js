'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { previewOccurrences } from './_lib/generateEvents';
import { formatPreviewItem } from './_lib/formatPreview';
import { createAvailabilityRuleAndEvents } from './actions';
import { useToast } from '@/app/_lib/ToastContext';
import { normalizeCalendarError } from './_lib/errors/calendarErrors';
import { CALENDAR_MESSAGES } from './_lib/errors/calendarMessages';

const WEEKDAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const DEFAULT_TIMEZONE = 'America/Chicago';

export default function CreateEventModal({
  lessons = [],
  adminId,
  onClose,
  initialDate,
}) {
  const router = useRouter();
  const { showToast } = useToast();

  /* =========================
      DATE HELPERS
  ========================= */
  const formatDateForInput = (dateObj) => {
    const d = new Date(dateObj);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = useMemo(() => formatDateForInput(new Date()), []);

  const safeOnClose = typeof onClose === 'function' ? onClose : () => {};

  /* =========================
      CORE STATE
  ========================= */
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? '');
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);

  // If initialDate exists, use its weekday; otherwise default to today
  const [weekday, setWeekday] = useState(
    initialDate ? new Date(initialDate).getDay() : new Date().getDay()
  );

  const [repeatEveryWeeks, setRepeatEveryWeeks] = useState(1);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('13:00');

  // If initialDate exists, pre-fill the date range inputs
  const [startsOn, setStartsOn] = useState(
    initialDate ? formatDateForInput(initialDate) : today
  );
  const [endsOn, setEndsOn] = useState(
    initialDate ? formatDateForInput(initialDate) : today
  );

  const [submitError, setSubmitError] = useState(null);
  const [isPending, startTransition] = useTransition();

  /* =========================
      TIMEZONE DETECTION
  ========================= */
  useEffect(() => {
    try {
      const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (localTZ) setTimezone(localTZ);
    } catch {
      setTimezone(DEFAULT_TIMEZONE);
    }
  }, []);

  /* =========================
      VALIDATION LOGIC
  ========================= */
  const validationError = useMemo(() => {
    if (startsOn < today) return 'Start date cannot be in the past.';
    if (endsOn < startsOn) return 'End date must be after or on start date.';
    if (startTime >= endTime) return 'End time must be after start time.';

    if (startsOn === today) {
      const now = new Date();
      const currentTimeString = now.toTimeString().slice(0, 5);
      if (startTime < currentTimeString) {
        return `Start time cannot be in the past. It is currently ${currentTimeString}.`;
      }
    }
    return null;
  }, [startsOn, endsOn, startTime, endTime, today]);

  /* =========================
      PREVIEW
  ========================= */
  const preview = useMemo(() => {
    if (!startsOn || !startTime || !endTime || validationError) return [];

    try {
      return previewOccurrences(
        {
          weekday,
          startTime,
          endTime,
          repeatEveryWeeks,
          startsOn,
          endsOn: endsOn || startsOn,
          timezone,
        },
        6
      ).map(formatPreviewItem);
    } catch {
      return [];
    }
  }, [
    weekday,
    startTime,
    endTime,
    repeatEveryWeeks,
    startsOn,
    endsOn,
    timezone,
    validationError,
  ]);

  /* =========================
      SUBMIT
  ========================= */
  function handleCreate() {
    setSubmitError(null);
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    startTransition(async () => {
      try {
        if (!adminId || !lessonId) return;

        const result = await createAvailabilityRuleAndEvents({
          lessonId,
          weekday,
          repeatEveryWeeks,
          startTime,
          endTime,
          startsOn,
          endsOn,
          timezone,
          createdBy: adminId,
        });

        if (result?.ok === false) {
          showToast(result.error.userMessage, result.error.severity);
          return;
        }

        showToast(CALENDAR_MESSAGES.SUCCESS_CREATE.userMessage, 'success');
        router.refresh();
        safeOnClose();
      } catch (err) {
        const normalized = normalizeCalendarError(err);
        showToast(normalized.userMessage, 'error');
      }
    });
  }

  if (!lessons.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Create Schedule</h2>
          <button
            onClick={safeOnClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-5 text-sm">
            <label className="col-span-2">
              <span className="block mb-1.5 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Lesson
              </span>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
              >
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="block mb-1.5 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Repeat Every
              </span>
              <select
                value={repeatEveryWeeks}
                onChange={(e) => setRepeatEveryWeeks(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} week{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="block mb-1.5 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Day of Week
              </span>
              <select
                value={weekday}
                onChange={(e) => setWeekday(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              >
                {WEEKDAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="block mb-1.5 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Start Time
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              />
            </label>

            <label>
              <span className="block mb-1.5 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                End Time
              </span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              />
            </label>

            <label>
              <span className="block mb-1.5 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Date Range Start
              </span>
              <input
                type="date"
                min={today}
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              />
            </label>

            <label>
              <span className="block mb-1.5 font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Date Range End
              </span>
              <input
                type="date"
                min={startsOn}
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5"
              />
            </label>
          </div>

          {validationError && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2">
              <span>⚠️</span> {validationError}
            </div>
          )}

          {!validationError && preview.length > 0 && (
            <div className="mt-6">
              <p className="text-[10px] font-black mb-3 text-slate-400 uppercase tracking-widest">
                Calculated Occurrences
              </p>
              <div className="grid grid-cols-1 gap-2">
                {preview.map((p, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[11px] text-slate-600 flex justify-between"
                  >
                    {p} <span className="text-slate-300">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
          <span className="text-[10px] text-slate-400 font-medium">
            TZ: {timezone}
          </span>
          <div className="flex gap-3">
            <button
              onClick={safeOnClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isPending || !!validationError}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:bg-slate-200 disabled:shadow-none transition-all active:scale-95"
            >
              {isPending ? 'Saving...' : 'Create Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
