'use server';

import { auth } from '@/app/_lib/auth';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { getGoogleCalendarEvents } from '@/app/_lib/google-calendar';

export async function attachCalendarEvent({ bookingId, event }) {
  const session = await auth();
  if (!session?.user?.adminId) throw new Error('Unauthorized');

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from('calendar').insert({
    booking_id: bookingId,
    google_event_id: event.id,
    title: event.title,
    description: event.description,
    start_time: event.start,
    end_time: event.end,
    meet_link: event.meetLink ?? null,
  });

  if (error) throw new Error(error.message);

  return true;
}
//============================================================
//SAVING CALENDAR EVENTS TO DATABASE
//=============================================================
/* ============================================================
   GOOGLE CALENDAR → SUPABASE
   RULE: Google-only events have NO session_key
   ============================================================ */

   export async function saveCalendarToSupabase(accessToken) {
     const supabase = createAdminSupabaseClient();
     const events = await getGoogleCalendarEvents(accessToken);

     let upserted = 0;

     for (const event of events) {
       // 1. Generate a key from the title (or use your time-window logic)
       // This ensures the event has a 'category' for the legend to pick up
       const generatedKey = normalizeSessionKey(event.title) || 'general_event';

       const { error } = await supabase.from('calendar').upsert(
         {
           google_event_id: event.id,
           title: event.title || 'Untitled Event',
           description: event.description,
           start_time: event.start,
           end_time: event.end,
           meet_link: event.meetLink,
           session_key: generatedKey, // ✅ NO LONGER NULL
         },
         { onConflict: 'google_event_id' }
       );

       if (error) throw error;
       upserted++;
     }

     return { processed: events.length, upserted };
   }

export async function saveCalendarToSupabase_old(accessToken) {
  const supabase = createAdminSupabaseClient();
  const events = await getGoogleCalendarEvents(accessToken);

  let upserted = 0;

  for (const event of events) {
    const { error } = await supabase.from('calendar').upsert(
      {
        google_event_id: event.id, // identity
        title: event.title || 'Untitled Event',
        description: event.description,
        start_time: event.start,
        end_time: event.end,
        meet_link: event.meetLink,
        session_key: null, // 🔒 CRITICAL RULE
      },
      {
        onConflict: 'google_event_id',
      }
    );

    if (error) throw error;
    upserted++;
  }

  return {
    processed: events.length,
    upserted,
  };
}

// ============================================================
// ASSIGN BOOKINGS TO CALENDAR (TIME-SLOT DRIVEN) NEW
// ============================================================
export async function assignBookingsToCalendar() {
  const supabase = createAdminSupabaseClient();

  /* ===================== 1. CALENDAR ===================== */
  const { data: events, error: eventError } = await supabase
    .from('calendar')
    .select('id, session_key, start_time');

  if (eventError) throw eventError;

  const validEvents = events.filter((e) => e.session_key);

  /* ===================== 2. BOOKINGS ===================== */
  const { data: bookings, error: bookingError } = await supabase.from(
    'bookings'
  ).select(`
      id,
      cancelled,
      "startDate",
      "endDate",
      "lessonId"
    `);

  if (bookingError) throw bookingError;

  /* ===================== 3. LESSONS ===================== */
  const { data: lessons, error: lessonError } = await supabase
    .from('lessons')
    .select('id, session_key');

  if (lessonError) throw lessonError;

  const sessionKeyByLessonId = Object.fromEntries(
    lessons.map((l) => [l.id, l.session_key])
  );

  /* ===================== 4. UNASSIGN CANCELLED ===================== */
  const cancelledIds = bookings
    .filter((b) => b.cancelled === true)
    .map((b) => b.id);

  if (cancelledIds.length > 0) {
    const { error } = await supabase
      .from('calendar_bookings')
      .delete()
      .in('booking_id', cancelledIds);

    if (error) throw error;
  }

  /* ===================== 5. ASSIGN ===================== */
  const rows = [];
  let total = 0;

  for (const event of validEvents) {
    const eventDate = toLocalDate(event.start_time);

    for (const booking of bookings) {
      if (booking.cancelled) continue;

      const bookingKey = sessionKeyByLessonId[booking.lessonId];
      if (!bookingKey) continue;

      if (bookingKey !== event.session_key) continue;

      const start = toLocalDate(booking.startDate);
      const end = toLocalDate(booking.endDate);

      if (eventDate < start || eventDate > end) continue;

      rows.push({
        calendar_id: event.id,
        booking_id: booking.id,
      });

      total++;
    }
  }

  /* ===================== 6. UPSERT ===================== */
  if (rows.length) {
    const { error } = await supabase
      .from('calendar_bookings')
      .upsert(rows, { onConflict: 'calendar_id,booking_id' });

    if (error) throw error;
  }

  return { linked: total, unassigned: cancelledIds.length };
}

import { validateCalendarEventInput } from './calendar-validators';

export async function createCalendarEvent(formData) {
  const input = {
    title: formData.get('title'),
    session_key: formData.get('session_key'),
    start_time: formData.get('start_time'),
    end_time: formData.get('end_time'),
  };

  validateCalendarEventInput(input);

  // safe to insert now
}

// ============================================================
// LESSON TIME WINDOWS (CST)
// ============================================================

const LESSON_WINDOWS = {
  1: { start: '12:00', end: '14:00' }, // Lesson Category 1
  2: { start: '16:30', end: '18:30' }, // Lesson Category 2
};

// ============================================================
// HELPERS
// ============================================================

function getLessonCategoryFromEvent(startTime, endTime) {
  const start = toCSTTime(startTime);
  const end = toCSTTime(endTime);

  for (const [lessonId, window] of Object.entries(LESSON_WINDOWS)) {
    if (start === window.start && end === window.end) {
      return Number(lessonId);
    }
  }
  return null;
}

function toCSTTime(dateString) {
  return new Date(dateString).toLocaleTimeString('en-US', {
   
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalDate(dateString) {
  const d = new Date(dateString);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

//GET ADMIN CALENDAR DATA
export async function getAdminCalendarData() {
  const supabase = createAdminSupabaseClient();

  // 1️⃣ Load all calendar events
  const { data: calendarEvents, error: evErr } = await supabase
    .from('calendar')
    .select('*')
    .order('start_time');

  if (evErr) throw new Error(evErr.message);

  // 2️⃣ Load all booking links WITH joined booking + student + lesson info
  const { data: calendarLinks, error: linkErr } = await supabase.from(
    'calendar_bookings'
  ).select(`
      calendar_id,
      booking_id,
      bookings:booking_id (
        id,
        "lessonId",
        students:studentId ( fullName ),
        lessons:lessonId ( name )
      )
    `);

  if (linkErr) throw new Error(linkErr.message);

  // 3️⃣ Merge booking details into each event
  const events = calendarEvents.map((ev) => {
    const bookingDetails = calendarLinks
      .filter((link) => link.calendar_id === ev.id)
      .map((link) => ({
        id: link.bookings.id,
        lessonId: link.bookings.lessonId,
        studentName: link.bookings.students?.fullName ?? 'Unknown Student',
        lessonName: link.bookings.lessons?.name ?? 'Unknown Lesson',
      }));

    return {
      ...ev,
      bookingDetails,
    };
  });

  return events;
}

//=======================================================================
//GET ADMIN BOOKINGS FOR DATE
//=======================================================================
// GET ADMIN BOOKINGS FOR A SPECIFIC DATE
export async function getAdminBookingsForDate(date) {
  if (!date) return [];

  const supabase = createAdminSupabaseClient();

  // Convert YYYY-MM-DD → full-day range
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  // 1️⃣ Load calendar sessions for the date
  const { data: calendarEvents, error: evErr } = await supabase
    .from('calendar')
    .select('*')
    .gte('start_time', startOfDay)
    .lte('start_time', endOfDay)
    .order('start_time');

  if (evErr) throw new Error(evErr.message);

  if (!calendarEvents.length) return [];

  const calendarIds = calendarEvents.map((e) => e.id);

  // 2️⃣ Load booking links WITH joined booking + student
  const { data: calendarLinks, error: linkErr } = await supabase
    .from('calendar_bookings')
    .select(`
      calendar_id,
      booking_id,
      bookings:booking_id (
        id,
        students:studentId ( fullName )
      )
    `)
    .in('calendar_id', calendarIds);

  if (linkErr) throw new Error(linkErr.message);

  // 3️⃣ Merge into SESSION DETAILS shape
  const sessions = calendarEvents.map((ev) => {
    const students = calendarLinks
      .filter((link) => link.calendar_id === ev.id)
      .map((link) => ({
        id: link.bookings.id,
        studentName:
          link.bookings.students?.fullName ?? 'Unknown Student',
      }));

    return {
      id: ev.id,                    // session id
      session_key: ev.session_key,  // canonical session key
      title: ev.title,              // lesson name
      start_time: ev.start_time,
      end_time: ev.end_time,
      meet_link: ev.meet_link,
      bookings: students,           // students for modal
    };
  });

  return sessions;
}





//GET FULL VIEW OF CALENDAR GROUPED IN EVENTS
export async function getFullViewData() {
  const supabase = createAdminSupabaseClient();

  // Load calendar events with joined booking & student info
  const { data, error } = await supabase
    .from('calendar_bookings')
    .select(
      `
      calendar_id,
      booking_id,
      calendar:calendar_id (
        start_time
      ),
      bookings:booking_id (
        id,
        "lessonId",
        students:studentId ( fullName ),
        lessons:lessonId ( name )
      )
    `
    )
    .order('calendar_id');

  if (error) throw new Error(error.message);

  // Group by calendar event
  const grouped = {};

  data.forEach((row) => {
    const eventId = row.calendar_id;

    if (!grouped[eventId]) {
      grouped[eventId] = {
        calendar_id: eventId,
        start_time: row.calendar?.start_time ?? null,
        bookings: [],
      };
    }

    grouped[eventId].bookings.push({
      booking_id: row.bookings.id,
      student_name: row.bookings.students?.fullName ?? 'Unknown',
      lesson_name: row.bookings.lessons?.name ?? 'Unknown',
    });
  });

  return Object.values(grouped);
}

//===============================================================
//NORMALIZE KEY TITLE
//===============================================================
function normalizeSessionKey(title) {
  if (!title) return null;

  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

//======================================================================
//CREATE AND UPDATE CALENDAR EVENT
//======================================================================

export async function createOrUpdateCalendarEvent(input) {
  validateCalendarEventInput(input);
  await validateSessionKeyExists(input.session_key);

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from('calendar').upsert(
    {
      title: input.title,
      session_key: input.session_key,
      start_time: input.start_time,
      end_time: input.end_time,
      meet_link: input.meet_link,
    },
    {
      // 🔒 Prevent duplicate admin-created sessions
      onConflict: 'session_key,start_time,end_time',
    }
  );

  if (error) throw error;
}
