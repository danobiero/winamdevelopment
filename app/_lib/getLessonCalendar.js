import { getSupabaseBrowserClient } from '@/app/_lib/supabase/client';

export async function getLessonCalendar(bookingId) {
  const supabase = getSupabaseBrowserClient();

  // 1️⃣ Get mapping rows
  const { data: mappings, error: mErr } = await supabase
    .from('calendar_bookings')
    .select('calendar_id')
    .eq('booking_id', bookingId);

  if (mErr) throw new Error(mErr.message);
  if (!mappings?.length) return {};

  const calendarIds = mappings.map((m) => m.calendar_id);

  // 2️⃣ Get events
  const { data: events, error: eErr } = await supabase
    .from('calendar')
    .select('*')
    .in('id', calendarIds);

  if (eErr) throw new Error(eErr.message);

  // 3️⃣ Build eventsByDate
  const eventsByDate = {};

  events.forEach((evt) => {
    const dateKey = evt.date.split('T')[0];
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(evt);
  });

  return eventsByDate;
}
