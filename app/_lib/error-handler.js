/**
 * Core Server-Side Error Handling & Sanitization System
 * 
 * Prevents developer-coded, database, or system-internal errors from
 * leaking to the end user, while ensuring full diagnostics are logged
 * securely on the server with unique incident tracking IDs.
 */

import crypto from 'crypto';

// Patterns that identify raw internal/developer error details
const TECHNICAL_ERROR_PATTERNS = [
  // Database / Postgres / Supabase
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
  /row-level security/i,
  /permission denied for/i,
  /supabase/i,
  /postgres/i,
  /sqlstate/i,

  // Runtime / Language
  /cannot read propert(y|ies)/i,
  /is not a function/i,
  /undefined/i,
  /null/i,
  /typeerror/i,
  /referenceerror/i,
  /rangeerror/i,
  /unhandled/i,
  /stack trace/i,
  /at\s+.*\.(js|jsx|ts|tsx):/i,

  // Network / Infrastructure
  /fetch failed/i,
  /econnrefused/i,
  /enotfound/i,
  /etimedout/i,
  /socket hang up/i,
  /500 internal server error/i,
  /502 bad gateway/i,
  /503 service unavailable/i,

  // Stripe / Secrets / APIs
  /sk_live/i,
  /sk_test/i,
  /stripe/i,
  /api key/i,
  /secret/i,
  /webhook/i,
];

/**
 * Generate a short, unique incident reference code (e.g. ERR-A83F2)
 */
export function generateErrorReferenceId() {
  const hash = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ERR-${hash}`;
}

/**
 * Checks if a string contains raw technical/developer/SQL feedback
 */
export function isTechnicalError(message) {
  if (!message || typeof message !== 'string') return true;
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Translates known internal/technical patterns into polite, human-readable feedback
 */
export function sanitizeErrorMessage(error, fallbackMessage = 'An unexpected error occurred. Please try again.') {
  if (!error) return fallbackMessage;

  const rawMessage = typeof error === 'string' ? error : error?.message || '';

  if (!rawMessage) return fallbackMessage;

  // 1. Duplicate record / unique constraint
  if (/duplicate key|unique constraint|already exists/i.test(rawMessage)) {
    return 'An entry with this information already exists in our system.';
  }

  // 2. Missing required data / null value
  if (/null value in column|required field|missing field/i.test(rawMessage)) {
    return 'Please fill in all required fields and try again.';
  }

  // 3. Foreign key or relational reference error
  if (/foreign key|violates foreign key/i.test(rawMessage)) {
    return 'The requested record is referenced by other items or could not be found.';
  }

  // 4. Session / Auth expiration or permissions
  if (/unauthorized|forbidden|access denied|login first|user not logged in/i.test(rawMessage)) {
    return 'Your session has expired or you do not have permission for this action. Please log in again.';
  }

  // 5. Network / timeout / service unavailable
  if (/fetch failed|econnrefused|enotfound|etimedout|502|503/i.test(rawMessage)) {
    return 'Unable to connect to the service. Please check your internet connection or try again in a few moments.';
  }

  // 6. Payment / Stripe general
  if (/payment|card|stripe/i.test(rawMessage) && isTechnicalError(rawMessage)) {
    return 'Payment processing encountered an issue. Please verify your payment details or contact support.';
  }

  // 7. If it matches ANY other technical pattern, withhold it
  if (isTechnicalError(rawMessage)) {
    return fallbackMessage;
  }

  // 8. If the message is already short, curated, and free of technical jargon, pass it through safely
  // (Caps length to 150 chars to avoid large stack dump leaks)
  if (rawMessage.length <= 150 && !/[{}[\]<>\\]/.test(rawMessage)) {
    return rawMessage;
  }

  return fallbackMessage;
}

/**
 * Securely logs full technical diagnostics to server console with a reference code,
 * while returning sanitized information safe for user consumption.
 * 
 * @param {Error|any} error - The caught exception or error object
 * @param {string} context - Name of the action or route (e.g. 'updateProfile', 'requestRedemption')
 * @param {string} [customFallback] - Optional polite message for the user
 * @returns {{ success: false, error: string, referenceId: string }}
 */
export function handleServerError(error, context = 'ServerOperation', customFallback) {
  const referenceId = generateErrorReferenceId();
  const rawMessage = error?.message || String(error);
  const userMessage = sanitizeErrorMessage(error, customFallback);

  // Secure server-side log for developers / administrators
  console.error(
    `[SERVER ERROR ${referenceId}] [Context: ${context}]`,
    {
      timestamp: new Date().toISOString(),
      rawMessage,
      stack: error?.stack || 'No stack trace available',
      errorObject: typeof error === 'object' ? error : undefined,
    }
  );

  return {
    success: false,
    error: userMessage,
    referenceId,
  };
}

/**
 * Higher-order wrapper for Server Actions to guarantee fail-safe execution
 * without exposing unhandled technical exceptions to the client.
 * 
 * @param {Function} actionFn - Async function performing the server action
 * @param {string} actionName - Descriptive identifier for logging
 * @param {string} [fallbackMessage] - Friendly user message if an error occurs
 */
export function safeServerAction(actionFn, actionName = 'SafeServerAction', fallbackMessage) {
  return async (...args) => {
    try {
      return await actionFn(...args);
    } catch (err) {
      return handleServerError(err, actionName, fallbackMessage);
    }
  };
}
