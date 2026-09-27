/**
 * Client-Safe Error Sanitization & User Feedback Utility
 * 
 * Safe for use in 'use client' components, modals, toasts, and forms.
 * Ensures that no raw Postgres error, stack trace, or developer jargon
 * is ever displayed in toast notifications or UI alerts.
 */

const TECHNICAL_PATTERNS = [
  /violates.*constraint/i,
  /duplicate key/i,
  /foreign key/i,
  /null value in column/i,
  /syntax error/i,
  /relation.*does not exist/i,
  /column.*does not exist/i,
  /invalid input syntax/i,
  /PGRST\d+/i,
  /JWT/i,
  /cannot read propert(y|ies)/i,
  /is not a function/i,
  /undefined/i,
  /typeerror/i,
  /referenceerror/i,
  /fetch failed/i,
  /econnrefused/i,
  /at\s+.*\.(js|jsx|ts|tsx):/i,
  /status code (5\d\d|4\d\d)/i,
  /internal server error/i,
];

/**
 * Formats any caught client error or server response into a polite,
 * professional message safe for end-user display in toasts or banners.
 * 
 * @param {Error|string|any} error - The error caught in try/catch or returned by action
 * @param {string} [fallback] - Polite fallback message
 * @returns {string} Clean, sanitized user-friendly string
 */
export function formatClientError(
  error,
  fallback = 'We were unable to complete your request. Please try again.'
) {
  if (!error) return fallback;

  const raw = typeof error === 'string' ? error : error?.message || '';
  if (!raw) return fallback;

  // Specific user-friendly translations
  if (/duplicate key|unique constraint|already exists/i.test(raw)) {
    return 'An entry with this information already exists.';
  }

  if (/null value|required field|missing field/i.test(raw)) {
    return 'Please ensure all required fields are filled out.';
  }

  if (/unauthorized|forbidden|access denied|login first|user not logged in/i.test(raw)) {
    return 'Your session has expired. Please log in again to continue.';
  }

  if (/fetch failed|network|econnrefused|timeout/i.test(raw)) {
    return 'Connection issue. Please check your internet connection and try again.';
  }

  // Check if technical
  const isTechnical = TECHNICAL_PATTERNS.some((p) => p.test(raw));
  if (isTechnical) {
    return fallback;
  }

  // If short and clean, safe to show
  if (raw.length <= 120 && !/[{}[\]<>\\]/.test(raw)) {
    return raw;
  }

  return fallback;
}
