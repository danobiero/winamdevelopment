'use server';

import { auth } from '@/app/_lib/auth';
import { revalidatePath } from 'next/cache';
import { getGoogleCalendarEvents } from '@/app/_lib/google-calendar';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin';
import { normalizeCalendarError } from '@/app/admin/calendar/_lib/errors/calendarErrors';
import { generateOccurrences } from '@/app/admin/calendar/_lib/generateEvents';
import { CALENDAR_MESSAGES } from './_lib/errors/calendarMessages';
import { getGoogleEventDetails } from './_lib/google-calendar-meet';
import { pushRecurringRuleToGoogle } from './_lib/google-calendar-service';
import { validateCalendarEventInput } from './calendar-validators';
import { deleteRecurringRuleFromGoogle } from './_lib/google-calendar-service';
import { deleteEventFromGoogle } from './_lib/google-calendar-service';

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

// ============================================================
// ASSIGN BOOKINGS TO CALENDAR (TIME-SLOT DRIVEN) NEW
// ============================================================

export async function assignBookingsToCalendar() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase.rpc(
      'assign_bookings_to_calendar_rpc'
    );

    if (error) throw error;

    const stats = data?.[0] ?? { linked_count: 0, unassigned_count: 0 };

    return {
      ok: true,
      linked: stats.linked_count,
      unassigned: stats.unassigned_count,
    };
  } catch (err) {
    console.error('[assignBookingsToCalendar]', err);
    return {
      ok: false,
      error: normalizeCalendarError(err),
    };
  }
}

//========================================================
//CREATE CALENDAR EVENT
//========================================================
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

//=============================================================
//GET ADMIN CALENDAR DATA
//=============================================================

export async function getAdminCalendarData() {
  const supabase = createAdminSupabaseClient();

  /* ===================== 1. LOAD CALENDAR + STATUS ===================== */
  const { data: calendarEvents, error: evErr } = await supabase
    .from('calendar')
    .select(
      `
      id,
      title,
      description,
      start_time,
      end_time,
      meet_link,
      session_key,
      source_event_id,

      calendar_events:source_event_id (
        status
      )
    `
    )
    .order('start_time');

  if (evErr) throw new Error(evErr.message);

  /* ===================== 2. LOAD BOOKING LINKS ===================== */
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

  /* ===================== 3. MERGE BOOKINGS + FLATTEN STATUS ===================== */
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
      status: ev.calendar_events?.status, // 🔑 REQUIRED
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
    .select(
      `
      calendar_id,
      booking_id,
      bookings:booking_id (
        id,
        students:studentId ( fullName )
      )
    `
    )
    .in('calendar_id', calendarIds);

  if (linkErr) throw new Error(linkErr.message);

  // 3️⃣ Merge into SESSION DETAILS shape
  const sessions = calendarEvents.map((ev) => {
    const students = calendarLinks
      .filter((link) => link.calendar_id === ev.id)
      .map((link) => ({
        id: link.bookings.id,
        studentName: link.bookings.students?.fullName ?? 'Unknown Student',
      }));

    return {
      id: ev.id, // session id
      session_key: ev.session_key, // canonical session key
      title: ev.title, // lesson name
      start_time: ev.start_time,
      end_time: ev.end_time,
      meet_link: ev.meet_link,
      bookings: students, // students for modal
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

//=================================================================
//CREATE AVAILABILITY RULE AND EVENTS
//=================================================================

export async function createAvailabilityRuleAndEvents(payload) {
  const supabase = createAdminSupabaseClient();

  try {
    /* 1. GENERATE OCCURRENCES */
    const occurrences = generateOccurrences({
      weekday: payload.weekday,
      startTime: payload.startTime,
      endTime: payload.endTime,
      repeatEveryWeeks: payload.repeatEveryWeeks,
      startsOn: payload.startsOn,
      endsOn: payload.endsOn,
      timezone: payload.timezone,
    });

    if (!occurrences.length) throw new Error('No dates generated');

    /* 2. PRE-CHECK MASTER LOG FOR ACTIVE DUPLICATES */
    const { data: existingSlots } = await supabase
      .from('master_calendar')
      .select('start_at')
      .eq('lesson_id', payload.lessonId)
      .eq('status', 'active')
      .in(
        'start_at',
        occurrences.map((o) => o.start_at)
      );

    if (existingSlots && existingSlots.length > 0) {
      // 🚩 This will be caught by the new 'Conflict' logic in normalizeCalendarError
      throw new Error(
        `Conflict: This lesson is already active for ${existingSlots.length} of the selected dates.`
      );
    }

    /* 3. INSERT THE MASTER RULE */
    const { data: rule, error: ruleError } = await supabase
      .from('lesson_availability_rules')
      .insert({
        lesson_id: payload.lessonId,
        timezone: payload.timezone,
        weekday: payload.weekday,
        start_time: payload.startTime,
        end_time: payload.endTime,
        repeat_every_weeks: payload.repeatEveryWeeks,
        starts_on: payload.startsOn,
        ends_on: payload.endsOn,
        created_by: payload.createdBy,
        is_active: true,
      })
      .select()
      .single();

    if (ruleError) throw ruleError;

    /* 4. PREPARE ROWS */
    const eventRows = occurrences.map((o) => ({
      availability_rule_id: rule.id,
      lesson_id: rule.lesson_id,
      start_at: o.start_at,
      end_at: o.end_at,
      timezone: o.timezone,
      status: 'scheduled',
    }));

    const masterRows = occurrences.map((o) => ({
      lesson_id: rule.lesson_id,
      start_at: o.start_at,
      end_at: o.end_at,
      timezone: rule.timezone,
      status: 'active',
    }));

    /* 5. UPDATE TABLES */
    await supabase.from('calendar_events').insert(eventRows);
    await supabase
      .from('master_calendar')
      .upsert(masterRows, { onConflict: 'lesson_id, start_at' });

    /* 6. SYNC STEPS */
    const publishResult = await publishCalendarEvents();
    if (!publishResult.ok) throw new Error(publishResult.error);

    const syncResult = await syncRecurringRulesToGoogle();
    if (!syncResult.ok) throw new Error(syncResult.error);

    revalidatePath('/admin/calendar');
    return { ok: true, generated: eventRows.length };
  } catch (err) {
    console.error('[createAvailabilityRuleAndEvents]', err);
    return {
      ok: false,
      error: normalizeCalendarError(err),
    };
  }
}


/* =====================================================
   LOAD LESSONS FOR ADMIN CALENDAR
   ===================================================== */
export async function getAdminLessons() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('lessons')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('getAdminLessons error:', error);
    throw new Error('Failed to load lessons');
  }

  // Normalize for UI
  return data.map((l) => ({
    id: l.id,
    title: l.name,
  }));
}

//==========================================================
//PUBLISH CALENDAR
//==========================================================
/* ============================
   Calendar Event Publisher
   ============================ */
export async function publishCalendarEvents() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({ status: 'published' })
      .eq('status', 'scheduled')
      .select('id');

    if (error) throw error;

    return {
      ok: true,
      published: data?.length ?? 0,
    };
  } catch (err) {
    console.error('[publishCalendarEvents]', err);
    return {
      ok: false,
      error: normalizeCalendarError(err),
    };
  }
}

//===============================================================
//UNPUBLISH AN EVENT
//===============================================================

export async function unpublishCalendarEvent(eventId) {
  const supabase = createAdminSupabaseClient();

  try {
    const { error } = await supabase
      .from('calendar_events')
      .update({ status: 'scheduled' })
      .eq('id', eventId);

    if (error) throw error;

    return {
      ok: true,
    };
  } catch (err) {
    return {
      ok: false,
      error: normalizeCalendarError(err),
    };
  }
}

//========================================================
//CANCEL A CALENDAR EVENT
//========================================================

export async function cancelCalendarEvent(eventId) {
  const supabase = createAdminSupabaseClient();
  const calendar = await getCalendar();

  try {
    // 1. Identify the event
    const { data: event } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (!event) return { ok: true };

    // 2. Remove from Google if it was exported
    if (event.google_event_id) {
      await calendar.events
        .delete({
          calendarId: event.google_calendar_id || 'primary',
          eventId: event.google_event_id,
        })
        .catch((e) => console.warn('Google event already gone'));
    }

    // 3. Update Master Log History
    await supabase
      .from('master_calendar')
      .update({ status: 'cancelled', deleted_at: new Date().toISOString() })
      .eq('lesson_id', event.lesson_id)
      .eq('start_at', event.start_at);

    // 4. THE CLEANUP: Delete from operational tables
    // This removes the 'ux_calendar_events_lesson_time' constraint blocker
    await supabase.from('calendar_events').delete().eq('id', eventId);

    revalidatePath('/admin/calendar');
    return { ok: true };
  } catch (err) {
    console.error('Cancellation Error:', err);
    return { ok: false, error: err.message };
  }
}

//===================================================================
//GET CALENDAR EVENTS
//===================================================================
//===================================================================
//GET CALENDAR EVENTS
//===================================================================
import { google } from 'googleapis';

async function getCalendar() {
  const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!jsonString) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not defined in environment variables.');
  }

  try {
    // Parse the full JSON string from your environment variable
    const credentials = JSON.parse(jsonString);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        // Handle newline characters in the private key
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const authClient = await auth.getClient();

    return google.calendar({
      version: 'v3',
      auth: authClient,
    });
  } catch (error) {
    console.error('Failed to initialize Google Calendar Auth:', error.message);
    throw new Error('Calendar authentication failed. Please check your GOOGLE_SERVICE_ACCOUNT_JSON formatting.');
  }
}

async function getCalendar_old() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: keyFile.client_email,
      private_key: keyFile.private_key.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar.events'],
  });

  const authClient = await auth.getClient();

  return google.calendar({
    version: 'v3',
    auth: authClient,
  });
}

//========================================================
// actions/google-sync.js SYNC TO GOOLE AND MEET LINK
//========================================================
export async function syncRecurringRulesToGoogle() {
  const supabase = createAdminSupabaseClient();
  const calendar = await getCalendar();
  const calendarId = process.env.ADMIN_GOOGLE_CALENDAR_ID;

  const { data: rules, error } = await supabase
    .from('lesson_availability_rules')
    .select('*, lessons(name)')
    .is('google_master_event_id', null)
    .eq('is_active', true);

  if (error) return { ok: false, error };
  if (!rules?.length) return { ok: true, synced: 0 };

  let syncedCount = 0;

  for (const rule of rules) {
    try {
      const startDT = `${rule.starts_on}T${rule.start_time}`;
      const endDT = `${rule.starts_on}T${rule.end_time}`;

      const googleData = await pushRecurringRuleToGoogle({
        title: rule.lessons?.name || 'Lesson',
        startDateTime: startDT,
        endDateTime: endDT,
        timezone: rule.timezone,
        weekday: rule.weekday,
        repeatEveryWeeks: rule.repeat_every_weeks,
        endsOn: rule.ends_on,
      });

      await supabase
        .from('lesson_availability_rules')
        .update({ google_master_event_id: googleData.master_id })
        .eq('id', rule.id);

      const { data: instancesData } = await calendar.events.instances({
        calendarId,
        eventId: googleData.master_id,
      });

      const instances = instancesData?.items || [];

      for (const instance of instances) {
        const startISO = instance.start?.dateTime || instance.start?.date;
        const datePart = startISO.split('T')[0];

        // FILLING BOTH ID COLUMNS HERE
        const { data: updatedRows } = await supabase
          .from('calendar_events')
          .update({
            google_event_id: instance.id,
            google_calendar_id: calendarId, // <--- Add this line
            status: 'exported',
            exported_at: new Date().toISOString(),
          })
          .eq('availability_rule_id', rule.id)
          .eq('status', 'published')
          .gte('start_at', `${datePart}T00:00:00`)
          .lte('start_at', `${datePart}T23:59:59`)
          .select();

        if (updatedRows?.length) {
          const calendarRows = updatedRows.map((ev) => ({
            source_event_id: ev.id,
            google_event_id: instance.id,
            google_calendar_id: calendarId, // <--- Consistency for 'calendar' table too
            title: rule.lessons?.name || 'Lesson',
            description: 'FLOW-NET Managed Lesson Series',
            start_time: ev.start_at,
            end_time: ev.end_at,
          }));

          await supabase
            .from('calendar')
            .upsert(calendarRows, { onConflict: 'source_event_id' });
        }
      }
      syncedCount++;
    } catch (err) {
      console.error(`❌ Sync failed for rule ${rule.id}:`, err);
    }
  }

  // Force the UI to fetch fresh data from the DB
  revalidatePath('/calendar');
  revalidatePath('/lessons');

  return { ok: true, synced: syncedCount };
}

//================================================================
//SYNC MEETING LINKS
//================================================================
/**
 * Scans calendar_events for missing links,
 * fetches from Google, and updates both tables.
 */
export async function syncMissingMeetingLinks() {
  const supabase = createAdminSupabaseClient();

  try {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('id, google_event_id')
      .not('google_event_id', 'is', null)
      .is('google_meet_link', null);

    if (error) throw error;
    if (!events?.length) return { ok: true, synced: 0 };

    let updateCount = 0;

    for (const event of events) {
      const googleData = await getGoogleEventDetails(event.google_event_id);

      if (googleData.meetLink) {
        // Update both tables
        await supabase
          .from('calendar_events')
          .update({ google_meet_link: googleData.meetLink })
          .eq('id', event.id);

        await supabase
          .from('calendar')
          .update({ meet_link: googleData.meetLink })
          .eq('source_event_id', event.id);

        updateCount++;
      }
    }

    return { ok: true, synced: updateCount };
  } catch (err) {
    console.error('SYNC_MEETING_LINKS_ERROR:', err);
    return {
      ok: false,
      error: normalizeCalendarError(err), // Returns the standard { message, code, etc }
    };
  }
}

//===============================================================
//RECONCILE GOOGLE CALENDAR CANCELLATION
//================================================================

/**
 * Reconciles external Google Calendar deletions for FLOW-NET.
 * Now specifically checks for 'cancelled' status to catch single-date deletions.
 */
export async function reconcileGoogleCancellations() {
  const supabase = createAdminSupabaseClient();
  const calendar = await getCalendar();
  const targetCalendarId = process.env.ADMIN_GOOGLE_CALENDAR_ID || 'primary';

  try {
    const now = new Date().toISOString();

    // 1. Fetch active exported events
    const { data: localEvents, error: fetchError } = await supabase
      .from('calendar_events')
      .select('id, lesson_id, start_at, google_event_id')
      .eq('status', 'exported')
      .not('google_event_id', 'is', null)
      .gte('start_at', now);

    if (fetchError || !localEvents?.length)
      return { ok: true, cancelledLocally: 0 };

    let removedCount = 0;

    // 2. Verify against Google
    for (const event of localEvents) {
      try {
        const response = await calendar.events.get({
          calendarId: targetCalendarId,
          eventId: event.google_event_id,
        });

        if (response.data.status === 'cancelled') throw { code: 404 };
      } catch (err) {
        if (err.code === 404 || err.code === 410) {
          // UPDATE MASTER LOG
          await supabase
            .from('master_calendar')
            .update({
              status: 'external_deletion',
              deleted_at: new Date().toISOString(),
            })
            .eq('lesson_id', event.lesson_id)
            .eq('start_at', event.start_at);

          // HARD DELETE FROM ACTIVE TABLE
          await supabase.from('calendar_events').delete().eq('id', event.id);

          removedCount++;
        }
      }
    }

    if (removedCount > 0) revalidatePath('/admin/calendar');

    return { ok: true, cancelledLocally: removedCount };
  } catch (err) {
    console.error('Reconciliation Error:', err);
    return { ok: false, error: err.message };
  }
}
