'use client';

import { formatLocalTime } from './timeFormater';

const STYLES = {
  error: 'bg-red-50 border-red-300 text-red-900',
  warning: 'bg-yellow-50 border-yellow-300 text-yellow-900',
  success: 'bg-green-50 border-green-300 text-green-900',
};

// Simple Icon Map
const ICONS = {
  error: '❌',
  warning: '⚠️',
  success: '✅',
};

export default function AdminErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  const style = STYLES[error.severity] || STYLES.error;
  const icon = ICONS[error.severity] || ICONS.error;

  return (
    <div
      className={`mb-6 rounded-lg border px-4 py-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${style}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="text-lg leading-none">{icon}</span>
          <div>
            {/* Title */}
            {error.title && (
              <h4 className="font-bold leading-none mb-1">{error.title}</h4>
            )}

            {/* Message */}
            {(error.userMessage || error.message) && (
              <p className="text-sm opacity-90">
                {error.userMessage ?? error.message}
              </p>
            )}

            {/* Optional time conflict */}
            {error.conflictKey?.start_time && (
              <div className="text-xs mt-2 font-mono bg-white/40 inline-block px-1 rounded">
                Time: {formatLocalTime(error.conflictKey.start_time)}
                {error.conflictKey.end_time
                  ? ` → ${formatLocalTime(error.conflictKey.end_time)}`
                  : null}
                <span className="ml-2">(local)</span>
              </div>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs font-bold uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
