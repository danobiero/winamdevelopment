import { google } from 'googleapis';

// The scope defines what the app is allowed to do.
// 'calendar.events' allows creating, editing, and deleting events.
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const auth = new google.auth.JWT(
  process.env.GOOGLE_CLIENT_EMAIL,
  null,
  // This replace is vital to handle how the private key is stored in .env
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  SCOPES
);

const calendar = google.calendar({ version: 'v3', auth });

/**
 * Creates an event on the Admin Calendar (obierofamily2019@gmail.com)
 * @param {Object} eventDetails
 * @param {string} eventDetails.title - Title of the event
 * @param {string} eventDetails.description - Details/Notes for the appointment
 * @param {string} eventDetails.startTime - ISO 8601 string (e.g., 2026-02-16T14:00:00Z)
 * @param {string} eventDetails.endTime - ISO 8601 string
 * @param {string} eventDetails.userEmail - The email of the person booking
 */
export async function createAdminEvent(eventDetails) {
  const { title, description, startTime, endTime, userEmail } = eventDetails;

  const event = {
    summary: `Praxida: ${title}`,
    description: description,
    start: {
      dateTime: startTime,
      timeZone: 'UTC', // Change this to your local timezone if preferred (e.g., 'America/Chicago')
    },
    end: {
      dateTime: endTime,
      timeZone: 'UTC',
    },
    // Adding the user as an attendee automatically sends them a calendar invite
    attendees: [{ email: userEmail }],
    // Adds a visual notification in the calendar
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID, // obierofamily2019@gmail.com
      resource: event,
      sendUpdates: 'all', // Sends the email invitation to the 'userEmail'
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Google Calendar API Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
