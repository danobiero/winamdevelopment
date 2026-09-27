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

    // Ensure both the session and the user's email exist
    if (!session || !session.user.shareholderId || !session.user.email) {
      return '/login';
    }

    const supabaseServer = createSupabaseServerClient();

    // 2. Check if the user is an Admin
    // Using maybeSingle() so it doesn't throw an error if the user isn't in the admins table
    const { data: adminUser, error: adminError } = await supabaseServer
      .from('admins')
      .select('id, role')
      .eq('email', session.user.email)
      .maybeSingle();

    if (adminError) {
      console.error('Supabase admin query error:', adminError);
    }

    // If the user exists in the admins table, route directly to account
    if (adminUser) {
      return '/account';
    }

    // 3. Fallback: Check standard shareholders status
    const { data: member, error: memberError } = await supabaseServer
      .from('membership_applications')
      .select('status')
      .eq('shareholder_id', session.user.shareholderId)
      .maybeSingle();

    if (memberError) {
      console.error('Supabase member query error:', memberError);
      return '/membership';
    }

    // 4. Direct to account if member status is complete, otherwise to membership
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
