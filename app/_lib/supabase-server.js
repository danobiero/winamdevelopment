import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createServerSupabaseClient(email) {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          'X-Client-Email': email ?? '',
        },
      },
      cookies: {
        get(name) {
          const direct = cookieStore.get(name);
          if (direct) return { name, value: direct.value };
          return undefined;
        },
      },
    }
  );
}
