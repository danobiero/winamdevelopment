'use client';

import { useState, useTransition } from 'react';
import {
  WrenchScrewdriverIcon,
  ClockIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  EyeIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { updateSystemMaintenanceConfig } from '@/app/_lib/maintenance-actions';

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDisplayDate(dateInput) {
  if (!dateInput) return 'Not set';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Not set';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function MaintenanceClient({ initialConfig, initialStatus }) {
  const [isPending, startTransition] = useTransition();
  const [config, setConfig] = useState(initialConfig || {});
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(
    Boolean(initialConfig?.is_maintenance_mode)
  );
  const [startTime, setStartTime] = useState(
    toDatetimeLocal(initialConfig?.maintenance_start_time)
  );
  const [endTime, setEndTime] = useState(
    toDatetimeLocal(initialConfig?.maintenance_end_time)
  );
  const [message, setMessage] = useState(
    initialConfig?.maintenance_message ||
      'Our platform is currently undergoing scheduled secure infrastructure and system maintenance.'
  );
  const [feedback, setFeedback] = useState(null);
  const [previewTab, setPreviewTab] = useState(null); // 'alert' | 'landing' | null

  // Quick Preset Handlers
  const handleSetStartNow = () => {
    const now = new Date();
    setStartTime(toDatetimeLocal(now.toISOString()));
  };

  const handleAddHoursToEnd = (hours) => {
    const base = startTime ? new Date(startTime) : new Date();
    const target = new Date(base.getTime() + hours * 60 * 60 * 1000);
    setEndTime(toDatetimeLocal(target.toISOString()));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    if (isMaintenanceMode && !endTime) {
      setFeedback({
        type: 'error',
        text: 'Please specify an end date and time for the maintenance window.',
      });
      return;
    }

    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
      setFeedback({
        type: 'error',
        text: 'Maintenance start time must be before the scheduled end time.',
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set('is_maintenance_mode', isMaintenanceMode ? 'true' : 'false');
      formData.set(
        'maintenance_start_time',
        startTime ? new Date(startTime).toISOString() : ''
      );
      formData.set(
        'maintenance_end_time',
        endTime ? new Date(endTime).toISOString() : ''
      );
      formData.set('maintenance_message', message);

      const res = await updateSystemMaintenanceConfig(null, formData);

      if (res?.error) {
        setFeedback({ type: 'error', text: res.message });
      } else {
        setFeedback({ type: 'success', text: res.message });
        if (res?.config) {
          setConfig(res.config);
        }
      }
    });
  };

  // Compute live current state for badges
  const now = Date.now();
  const startMs = startTime ? new Date(startTime).getTime() : null;
  const endMs = endTime ? new Date(endTime).getTime() : null;

  let liveStatus = {
    badge: 'Operational',
    color: 'emerald',
    description: 'System is running normally. Shareholder accounts are open and active.',
  };

  if (isMaintenanceMode) {
    if (startMs && endMs) {
      if (now >= startMs && now <= endMs) {
        liveStatus = {
          badge: 'Active Maintenance',
          color: 'rose',
          description: `System is locked under maintenance until ${formatDisplayDate(endTime)}. Shareholder landing pages are gated.`,
        };
      } else if (now < startMs) {
        const hoursLeft = (startMs - now) / (1000 * 60 * 60);
        if (hoursLeft <= 8) {
          liveStatus = {
            badge: '8-Hour Advance Notice Active',
            color: 'amber',
            description: `Maintenance starts in ${hoursLeft.toFixed(1)} hours. Logged-in shareholders will receive advance warning popups.`,
          };
        } else {
          liveStatus = {
            badge: 'Scheduled',
            color: 'blue',
            description: `Maintenance scheduled to begin ${formatDisplayDate(startTime)}. Advance notice popup activates 8 hours prior.`,
          };
        }
      } else {
        liveStatus = {
          badge: 'Window Elapsed',
          color: 'slate',
          description: 'Scheduled end time has passed. System remains locked until maintenance toggle is turned off or updated.',
        };
      }
    } else if (endMs) {
      if (now <= endMs) {
        liveStatus = {
          badge: 'Active Maintenance',
          color: 'rose',
          description: `Platform currently under maintenance until ${formatDisplayDate(endTime)}.`,
        };
      } else {
        liveStatus = {
          badge: 'Window Elapsed',
          color: 'slate',
          description: 'Scheduled end time has passed. Please turn off maintenance toggle.',
        };
      }
    } else {
      liveStatus = {
        badge: 'Immediate Maintenance Active',
        color: 'rose',
        description: 'System is actively in maintenance mode without scheduled time bounds.',
      };
    }
  }

  return (
    <div className="space-y-6">
      {/* --- STATUS OVERVIEW CARD --- */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`p-3 rounded-xl shrink-0 ${
                liveStatus.color === 'rose'
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  : liveStatus.color === 'amber'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : liveStatus.color === 'blue'
                  ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  : liveStatus.color === 'slate'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {liveStatus.color === 'rose' ? (
                <ShieldExclamationIcon className="h-6 w-6" />
              ) : liveStatus.color === 'amber' ? (
                <BellAlertIcon className="h-6 w-6" />
              ) : (
                <WrenchScrewdriverIcon className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">
                  Current Status
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    liveStatus.color === 'rose'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                      : liveStatus.color === 'amber'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : liveStatus.color === 'blue'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : liveStatus.color === 'slate'
                      ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      liveStatus.color === 'rose'
                        ? 'bg-rose-500'
                        : liveStatus.color === 'amber'
                        ? 'bg-amber-500'
                        : liveStatus.color === 'blue'
                        ? 'bg-blue-500'
                        : liveStatus.color === 'slate'
                        ? 'bg-slate-400'
                        : 'bg-emerald-500'
                    }`}
                  />
                  {liveStatus.badge}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
                {liveStatus.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPreviewTab(previewTab === 'alert' ? null : 'alert')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                previewTab === 'alert'
                  ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <EyeIcon className="h-3.5 w-3.5" />
              Preview 8h Alert
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab(previewTab === 'landing' ? null : 'landing')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                previewTab === 'landing'
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                  : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              <EyeIcon className="h-3.5 w-3.5" />
              Preview Account Screen
            </button>
          </div>
        </div>
      </div>

      {/* --- PREVIEW ACCORDION (IF OPEN) --- */}
      {previewTab === 'alert' && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
              <BellAlertIcon className="h-5 w-5" />
              Live Preview: 8-Hour Advance Notice Popup for Shareholders
            </div>
            <button
              onClick={() => setPreviewTab(null)}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline"
            >
              Close Preview
            </button>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Account holders who log in within 8 hours prior to maintenance start will see this modal notification:
          </p>
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl p-5 shadow-lg max-w-lg mx-auto">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
              <ClockIcon className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Upcoming System Maintenance
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              We have scheduled a mandatory security & infrastructure maintenance window. During this period, account transactions and dashboard access will be temporarily paused.
            </p>
            <div className="bg-amber-50/60 dark:bg-amber-950/40 rounded-lg p-3 text-xs space-y-1.5 border border-amber-100 dark:border-amber-900/50 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Starts:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatDisplayDate(startTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Concludes:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatDisplayDate(endTime)}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                I Understand & Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {previewTab === 'landing' && (
        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
              <ShieldExclamationIcon className="h-5 w-5" />
              Live Preview: Account Landing Page Under Maintenance
            </div>
            <button
              onClick={() => setPreviewTab(null)}
              className="text-xs text-rose-700 dark:text-rose-400 hover:underline"
            >
              Close Preview
            </button>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-400">
            When maintenance mode is actively running, any shareholder visiting their account landing page will see this screen:
          </p>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xl">
            <div className="inline-flex p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 mb-4">
              <WrenchScrewdriverIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">
              System Under Secure Maintenance
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto mb-6">
              {message}
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 max-w-sm mx-auto mb-6 text-left">
              <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">
                Estimated Service Restoration
              </div>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                {formatDisplayDate(endTime)}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your investment positions, shareholdings, and ledger balances remain secure and fully protected.
            </p>
          </div>
        </div>
      )}

      {/* --- NOTIFICATION FEEDBACK --- */}
      {feedback && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? (
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{feedback.text}</span>
        </div>
      )}

      {/* --- CONFIGURATION FORM --- */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Maintenance Mode Toggle
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enable or disable system-wide maintenance scheduling.
              </p>
            </div>

            {/* TOGGLE SWITCH */}
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                name="is_maintenance_mode"
                checked={isMaintenanceMode}
                onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-200 peer-focus:outline-hidden peer-focus:ring-2 peer-focus:ring-purple-400 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
              <span className="ml-3 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isMaintenanceMode ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {/* DATE & TIME WINDOW SETTINGS */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Schedule Maintenance Window
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define when maintenance starts and when service will be restored.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* START TIME */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Maintenance Start Time
                  </label>
                  <button
                    type="button"
                    onClick={handleSetStartNow}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                  >
                    Set to Now
                  </button>
                </div>
                <input
                  type="datetime-local"
                  name="maintenance_start_time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Shareholders logging in within 8 hours before this start time receive an advance alert popup.
                </p>
              </div>

              {/* END TIME */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Maintenance End Time (Restoration)
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-slate-400">Quick:</span>
                    <button
                      type="button"
                      onClick={() => handleAddHoursToEnd(2)}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                    >
                      +2h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddHoursToEnd(4)}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                    >
                      +4h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddHoursToEnd(8)}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                    >
                      +8h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddHoursToEnd(24)}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                    >
                      +24h
                    </button>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  name="maintenance_end_time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Displayed clearly on the shareholder account landing page as the service return time.
                </p>
              </div>
            </div>
          </div>

          {/* CUSTOM MESSAGE */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Maintenance Message (Displayed on Landing Screen)
            </label>
            <textarea
              name="maintenance_message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Our platform is currently undergoing scheduled secure infrastructure and system maintenance."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
            />
          </div>

          {/* EXPLANATORY HINT */}
          <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/40 flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 dark:text-purple-300 space-y-1">
              <p className="font-semibold">Automated Platform Behavior:</p>
              <ul className="list-disc list-inside space-y-0.5 text-purple-800 dark:text-purple-300/80">
                <li>
                  <span className="font-medium">8 Hours Before Start:</span> Logged-in shareholders automatically receive a modal alert informing them of the upcoming maintenance start and end times.
                </li>
                <li>
                  <span className="font-medium">During Maintenance Window:</span> The account landing page transitions to the secure maintenance message displaying the scheduled end time.
                </li>
                <li>
                  <span className="font-medium">Admin Access:</span> Administrative portals remain fully accessible to system administrators to manage and lift maintenance mode at any time.
                </li>
              </ul>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isPending ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  Save Maintenance Settings
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
