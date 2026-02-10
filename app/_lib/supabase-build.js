// app/_lib/supabase-build.ts
import { createClient } from "@supabase/supabase-js";

export function createSupabaseBuildClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // safe only on server
  );
}
