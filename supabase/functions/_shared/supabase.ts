import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * Create a Supabase admin client (bypasses RLS).
 * Use for all database writes in Edge Functions.
 */
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a Supabase client authenticated as the requesting user.
 * Used to verify user identity from the x-user-token header.
 */
export function createUserClient(userToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${userToken}` },
    },
  });
}

/**
 * Verify user from request headers and return user object.
 * Returns null if authentication fails.
 */
export async function getAuthenticatedUser(req: Request) {
  const userToken = req.headers.get("x-user-token");
  if (!userToken) return null;

  const client = createUserClient(userToken);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  return user;
}
