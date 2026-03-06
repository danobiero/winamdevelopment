import { google } from 'googleapis';
import { createAdminSupabaseClient } from '@/app/_lib/supabase-admin'; 

const WEEKDAY_MAP = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const calendarId = process.env.ADMIN_GOOGLE_CALENDAR_ID;

/**
 * AUTHENTICATION
 * Uses the full JSON string from environment variables for security.
 */
const getAuth = async () => {
  const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!jsonString) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is not defined in environment variables.'
    );
  }

  try {
    const credentials = JSON.parse(jsonString);

    // Ensure private key newlines are handled correctly
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }

    return new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });
  } catch (error) {
    console.error('Auth Parsing Error:', error);
    throw new Error(
      'Failed to parse Google Service Account JSON. Check your .env formatting.'
    );
  }
};

export const getCalendar = async () => {
  const auth = await getAuth();
  // Pass the auth object directly to the calendar constructor
  return google.calendar({ version: 'v3', auth });
};

/**
 * PUSH RECURRING RULE
 */
export async function pushRecurringRuleToGoogle({
  title,
  startDateTime,
  endDateTime,
  timezone,
  weekday,
  repeatEveryWeeks,
  endsOn,
}) {
  const calendar = await getCalendar();
  const weekdayCode = WEEKDAY_MAP[weekday];

  // RFC5545 UNTIL must be UTC
  const untilUTC =
    new Date(`${endsOn}T23:59:59Z`)
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0] + 'Z';

  const event = {
    summary: title,
    description: 'FLOW-NET Managed Lesson Series',
    start: { dateTime: startDateTime, timeZone: timezone },
    end: { dateTime: endDateTime, timeZone: timezone },
    recurrence: [
      `RRULE:FREQ=WEEKLY;INTERVAL=${repeatEveryWeeks};BYDAY=${weekdayCode};UNTIL=${untilUTC}`,
    ],
  };

  const { data } = await calendar.events.insert({
    calendarId: calendarId || 'primary',
    requestBody: event,
  });

  return { master_id: data.id };
}

/**
 * DELETE EVENT
 * Handles both Google Calendar removal and Supabase database updates.
 */
export async function deleteEventFromGoogle(
  googleEventId,
  googleCalendarId,
  eventId
) {
  const calendar = await getCalendar();
  const supabase = createAdminSupabaseClient();
  const targetCalendarId = googleCalendarId || calendarId || 'primary';

  try {
    // 1. Remove from Google
    await calendar.events.delete({
      calendarId: targetCalendarId,
      eventId: googleEventId,
    });
  } catch (error) {
    // If it's already gone from Google, we treat it as a success for the deletion flow
    if (error.code !== 404 && error.code !== 410) {
      console.error('Google API Deletion Error:', error);
      throw error;
    }
  }

  try {
    // 2. Fetch event details for the master log update
    const { data: event } = await supabase
      .from('calendar_events')
      .select('lesson_id, start_at')
      .eq('id', eventId)
      .single();

    if (event) {
      // 3. Update Master Log status
      await supabase
        .from('master_calendar')
        .update({
          status: 'cancelled',
          deleted_at: new Date().toISOString(),
        })
        .eq('lesson_id', event.lesson_id)
        .eq('start_at', event.start_at);

      // 4. Hard delete from active events table
      await supabase.from('calendar_events').delete().eq('id', eventId);
    }

    return { ok: true };
  } catch (dbError) {
    console.error('Database Sync Error during deletion:', dbError);
    throw dbError;
  }
}
