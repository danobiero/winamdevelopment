// app/_lib/errors/normalizeCalendarError.js
import { CALENDAR_MESSAGES } from './calendarMessages';

export function normalizeCalendarError(err) {
  if (!err) return null;

  // Handle custom errors thrown with "new Error('Conflict: ...')"
  if (err.message && err.message.includes('Conflict')) {
    return {
      ...CALENDAR_MESSAGES.DUPLICATE_EVENT,
      message: err.message, // Preserve the specific count of overlapping dates
    };
  }

  const code = err.code || err.statusCode;

  switch (code) {
    case '23505':
      return CALENDAR_MESSAGES.DUPLICATE_EVENT;

    case '23P01':
      return CALENDAR_MESSAGES.OVERLAPPING_EVENT;

    case '23514':
      return CALENDAR_MESSAGES.INVALID_TIME_RANGE;

    default:
      // If the error has a message but no code, try to return the message
      if (err.message) {
        return {
          ...CALENDAR_MESSAGES.GENERIC_FAILURE,
          message: err.message,
        };
      }
      return CALENDAR_MESSAGES.GENERIC_FAILURE;
  }
}
