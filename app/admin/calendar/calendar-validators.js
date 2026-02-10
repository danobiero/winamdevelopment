export function validateCalendarEventInput(input) {
  if (!input.session_key) {
    throw new Error(
      'Session key is required for lesson-based calendar events.'
    );
  }
}

export async function validateSessionKeyExists(session_key) {
  const supabase = createAdminSupabaseClient();

  const { data } = await supabase
    .from('lessons')
    .select('id')
    .eq('session_key', session_key)
    .maybeSingle();

  if (!data) {
    throw new Error(`Invalid session key: ${session_key}`);
  }
}
