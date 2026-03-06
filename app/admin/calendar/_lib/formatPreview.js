import { DateTime } from 'luxon';

export function formatPreviewItem(item) {
  const start = DateTime.fromISO(item.start_local, {
    zone: item.timezone,
  });
  const end = DateTime.fromISO(item.end_local, {
    zone: item.timezone,
  });

  return `${start.toFormat('ccc LLL dd, yyyy')} • ${start.toFormat(
    'hh:mm a'
  )}–${end.toFormat('hh:mm a')} (${item.timezone})`;
}
