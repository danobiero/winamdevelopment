export async function getGoogleCalendarEvents(accessToken) {
  if (!accessToken) {
    throw new Error('No access token found. Admin must re-login.');
  }

  const calendarId = process.env.ADMIN_GOOGLE_CALENDAR_ID;

  const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true&orderBy=startTime`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('❌ Google Calendar Error:', errorText);
    throw new Error('Failed to load Google Calendar events');
  }

  const data = await res.json();

  return (
    data.items
      ?.filter((ev) => ev.start?.dateTime)
      ?.map((event) => ({
        id: event.id,
        title: event.summary ?? 'Untitled Event',
        description: event.description ?? '',
        start: event.start.dateTime,
        end: event.end.dateTime,
        meetLink: event.hangoutLink ?? null,
      })) ?? []
  );
}
