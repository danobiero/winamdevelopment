import { DateTime } from 'luxon';

export function generateOccurrences(rule, { limit = Infinity } = {}) {
  const {
    weekday,
    startTime,
    endTime,
    repeatEveryWeeks,
    startsOn,
    endsOn,
    timezone,
  } = rule;

  const startDate = DateTime.fromISO(startsOn, { zone: timezone }).startOf(
    'day'
  );
  const endDate = DateTime.fromISO(endsOn, { zone: timezone }).endOf('day');

  if (!startDate.isValid || !endDate.isValid) {
    throw new Error('Invalid start or end date');
  }

  // Luxon weekday: Monday=1 ... Sunday=7
  const targetLuxonWeekday = weekday === 0 ? 7 : weekday;

  let cursor = startDate;

  const daysForward = (targetLuxonWeekday - cursor.weekday + 7) % 7;
  cursor = cursor.plus({ days: daysForward });

  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);

  const results = [];
  let count = 0;

  while (cursor <= endDate && count < limit) {
    const weeksSinceStart = Math.floor(cursor.diff(startDate, 'weeks').weeks);

    if (weeksSinceStart % repeatEveryWeeks === 0) {
      const startLocal = cursor.set({
        hour: sh,
        minute: sm,
        second: 0,
        millisecond: 0,
      });

      const endLocal = cursor.set({
        hour: eh,
        minute: em,
        second: 0,
        millisecond: 0,
      });

      if (endLocal <= startLocal) {
        throw new Error('End time must be after start time');
      }

      results.push({
        /* Store UTC for database */
        start_at: startLocal.toUTC().toISO(),
        end_at: endLocal.toUTC().toISO(),

        /* Preserve original local time */
        start_local: startLocal.toISO(),
        end_local: endLocal.toISO(),

        timezone,
      });

      count++;
    }

    cursor = cursor.plus({ weeks: 1 });
  }

  return results;
}

export function previewOccurrences(rule, limit = 6) {
  return generateOccurrences(rule, { limit });
}
