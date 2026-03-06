// app/_lib/errors/calendarMessages.js
export const CALENDAR_MESSAGES = {
  DUPLICATE_EVENT: {
    title: 'Duplicate Session',
    userMessage: 'This session already exists at the selected time.',
    severity: 'warning',
  },
  OVERLAPPING_EVENT: {
    title: 'Schedule Conflict',
    userMessage: 'This session overlaps with another scheduled session.',
    severity: 'warning',
  },
  INVALID_TIME_RANGE: {
    title: 'Invalid Time',
    userMessage: 'End time must be after start time.',
    severity: 'error',
  },
  GENERIC_FAILURE: {
    title: 'Error',
    userMessage: 'Unable to process the request. Please try again.',
    severity: 'error',
  },
  SUCCESS_CREATE: {
    title: 'Success',
    userMessage: 'Schedule created successfully.',
    severity: 'success',
  },
};
