import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

/**
 * Browser-side Supabase client (uses anon key).
 * Untyped — we use manual types in components since we don't have Supabase codegen.
 * Once the DB is live, run `npx supabase gen types typescript` and replace the Database type.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/** Server-side Supabase client (uses service role key for admin operations) */
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
