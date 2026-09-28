'use server';

import { createClient } from '@supabase/supabase-js';
import { unstable_noStore as noStore } from 'next/cache';

import { auth } from '../_lib/auth';

// Creating supabase client server
function createSupabaseServerClient() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Verifies if the user is an Admin or a Member and routes accordingly.
 * @returns {Promise<string>} The destination URL path
 */
export async function getMemberRoute() {
  noStore();

  try {
    // 1. Authenticate session
    const session = await auth();

    if (!session || !session.user?.email) {
      return '/login';
    }

    // 2. Check if the session is already an Admin
    if (session.user.adminId) {
      return '/admin';
    }

    const supabaseServer = createSupabaseServerClient();

    // 3. Check if the user is an Admin in the database
    const { data: adminUser, error: adminError } = await supabaseServer
      .from('admins')
      .select('id, role')
      .ilike('email', session.user.email)
      .maybeSingle();

    if (adminError) {
      console.error('Supabase admin query error:', adminError);
    }

    if (adminUser) {
      return '/admin';
    }

    // 4. For shareholders, find shareholder ID
    let shareholderId = session.user.shareholderId;

    if (!shareholderId) {
      const { data: sh } = await supabaseServer
        .from('shareholders')
        .select('id')
        .ilike('email', session.user.email)
        .maybeSingle();
      shareholderId = sh?.id;
    }

    if (!shareholderId) {
      return '/membership';
    }

    // 5. Check standard shareholders membership application status
    const { data: member, error: memberError } = await supabaseServer
      .from('membership_applications')
      .select('status')
      .eq('shareholder_id', shareholderId)
      .maybeSingle();

    if (memberError) {
      console.error('Supabase member query error:', memberError);
      return '/membership';
    }

    // 6. Direct to account if member status is complete, otherwise to membership
    if (member?.status === 'completed') {
      return '/account';
    } else {
      return '/membership';
    }
  } catch (error) {
    console.error('Error verifying Winam routing status:', error);
    return '/membership';
  }
}
