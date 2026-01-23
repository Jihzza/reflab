import { supabase } from '@/lib/supabaseClient'

// Profile shape matching the profiles table
export interface Profile {
  id: string
  username: string
  username_customized: boolean
  role: 'user' | 'moderator' | 'admin'
  name: string | null
  email: string | null
  photo_url: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Check if profile is complete (custom username + name set)
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false
  return profile.username_customized && profile.name !== null
}

/**
 * Fetch the current user's profile
 */
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { profile: data as Profile | null, error }
}

/**
 * Update the current user's profile
 */
export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'username' | 'name' | 'photo_url'>>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { profile: data as Profile | null, error }
}

/**
 * Set custom username (marks profile as customized)
 * Returns specific error for username conflicts
 */
export async function setUsername(userId: string, username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ username, username_customized: true })
    .eq('id', userId)
    .select()
    .single()

  // Check for unique constraint violation (username taken)
  if (error?.code === '23505') {
    return {
      profile: null,
      error: { ...error, message: 'Username is already taken' },
    }
  }

  return { profile: data as Profile | null, error }
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailable(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
    .maybeSingle()

  if (error) {
    return { available: false, error }
  }

  return { available: data === null, error: null }
}

/**
 * Update last_login_at timestamp
 */
export async function updateLastLogin(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId)

  return { error }
}
