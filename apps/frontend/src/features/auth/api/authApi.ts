import { supabase } from "@/lib/supabaseClient";
import { AUTH_CONFIG, getRedirectUrl } from "@/config/auth";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign up with email and password
 * Profile is auto-created via database trigger
 */
export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // No email confirmation required - immediate access
      emailRedirectTo: undefined,
    },
  });

  return { data, error };
}

/**
 * Sign in with Google OAuth
 * PKCE flow with explicit code exchange in OAuthCallbackPage
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Redirect to dedicated callback page for code exchange
      redirectTo: AUTH_CONFIG.oauth.google.redirectTo,
    },
  });

  return { data, error };
}

/**
 * Exchange OAuth authorization code for session (PKCE flow)
 * Called from OAuthCallbackPage after OAuth provider redirects back
 */
export async function exchangeCodeForSession(code: string) {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl('afterPasswordReset'),
  });

  return { data, error };
}

/**
 * Update user's password (requires active session)
 */
export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

/**
 * Subscribe to auth state changes
 * Returns unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}
