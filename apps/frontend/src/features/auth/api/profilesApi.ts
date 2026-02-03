import { supabase } from "@/lib/supabaseClient";

/**
 * Profile interface matching the database structure
 */
export interface Profile {
  id: string;
  username: string;
  username_customized: boolean;
  role: "user" | "admin";
  name: string | null;
  email: string;
  photo_url: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get profile by user ID
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return { profile: data as Profile | null, error };
}

/**
 * Update username and mark as customized
 */
export async function updateUsername(userId: string, username: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      username,
      username_customized: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  // Handle unique constraint violation (duplicate username)
  if (error?.code === "23505") {
    return {
      profile: null,
      error: new Error("Username is already taken"),
    };
  }

  return { profile: data as Profile | null, error };
}

/**
 * Check if username is available (case-insensitive)
 * Returns true if available, false if taken
 */
export async function checkUsernameAvailable(username: string, currentUserId?: string) {
  let query = supabase
    .from("profiles")
    .select("id")
    .ilike("username", username);

  // Exclude current user if checking for update
  if (currentUserId) {
    query = query.neq("id", currentUserId);
  }

  const { data, error } = await query;

  if (error) {
    return { available: false, error };
  }

  // Available if no rows found
  return { available: data.length === 0, error: null };
}
