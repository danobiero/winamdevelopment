import { getSupabaseBrowserClient } from '@/app/_lib/supabase/client';

export async function getStudentCalendar(studentId) {
  const supabase = getSupabaseBrowserClient();

  // 1️⃣ Get bookings for this student
  const { data: bookings, error: bErr } = await supabase
    .from('bookings')
    .select('id')
    .eq('studentId', studentId);

  if (bErr) throw new Error(bErr.message);
  if (!bookings.length) return {};

  const bookingIds = bookings.map((b) => b.id);

  // 2️⃣ Get calendar_bookings mappings
  const { data: mappings, error: mErr } = await supabase
    .from('calendar_bookings')
    .select('calendar_id, booking_id')
    .in('booking_id', bookingIds);

  if (mErr) throw new Error(mErr.message);
  if (!mappings.length) return {};

  const calendarIds = mappings.map((m) => m.calendar_id);

  // 3️⃣ Get full calendar events
  const { data: events, error: eErr } = await supabase
    .from('calendar')
    .select('*')
    .in('id', calendarIds);

  if (eErr) throw new Error(eErr.message);

  // 4️⃣ Build eventsByDate
  const eventsByDate = {};

  events.forEach((evt) => {
    const dateKey = evt.date.split('T')[0]; // normalize
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(evt);
  });

  return eventsByDate;
}
