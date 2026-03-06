import { google } from 'googleapis';

/**
 * Fetches specific event details from Google,
 * primarily used to retrieve the 'hangoutLink' (Google Meet).
 */
export async function getGoogleEventDetails(googleEventId) {
  const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.ADMIN_GOOGLE_CALENDAR_ID;

  if (!jsonString) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is not defined in environment variables.'
    );
  }

  if (!calendarId) {
    throw new Error(
      'ADMIN_GOOGLE_CALENDAR_ID is not defined in environment variables.'
    );
  }

  try {
    // Parse the credentials from the environment variable
    const credentials = JSON.parse(jsonString);

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        // Ensure private key newlines are properly formatted
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar.events.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const { data } = await calendar.events.get({
      calendarId,
      eventId: googleEventId,
    });

    return {
      meetLink: data.hangoutLink || null, // This is the Meet URL
      status: data.status,
      htmlLink: data.htmlLink,
    };
  } catch (err) {
    // If it's a parsing error or a Google API error
    console.error(`Google API Error for event ${googleEventId}:`, err.message);
    throw err;
  }
}
