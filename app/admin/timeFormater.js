// Converts Postgres timestamps like
// "2026-02-21 01:00:00+00" → ISO-like string
export function normalizePostgresTimestamp(ts) {
  if (typeof ts !== 'string') return ts;

  if (ts.includes(' ') && ts.includes('+')) {
    const [date, timePlus] = ts.split(' ');
    const patched = timePlus.replace(/([+-]\d{2})$/, '$1:00');
    return `${date}T${patched}`;
  }

  return ts;
}

// Formats using the USER'S computer clock (local timezone)
export function formatLocalTime(ts) {
  const iso = normalizePostgresTimestamp(ts);
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) return ts;

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}
