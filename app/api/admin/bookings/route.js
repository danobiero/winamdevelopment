export const dynamic = 'force-dynamic';

import { createAdminSupabaseClient } from '@/app/_lib/supabase';

export async function GET() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
      id,
      students(fullName)
    `
    )
    .order('id', { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json(data);
}
