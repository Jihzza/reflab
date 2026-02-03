import type { Session, User } from "@supabase/supabase-js";

/**
 * Auth status states for the application
 */
export type AuthStatus =
  | "checking_session" // Initial load, checking for existing session
  | "authenticated" // User is signed in
  | "unauthenticated" // No active session
  | "error"; // Error during auth check

/**
 * Form error structure for inline validation
 */
export interface AuthFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  general?: string; // For non-field-specific errors
}

/**
 * Auth context interface provided by AuthProvider
 */
export interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  authStatus: AuthStatus;
  sessionExpired: boolean;

  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;

  // Session management
  dismissSessionExpired: () => void;
}
