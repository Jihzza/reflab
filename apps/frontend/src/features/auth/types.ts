import type { Session, User } from '@supabase/supabase-js'

// The shape of our auth context - what any component can access via useAuth()
export interface AuthContextType {
  // The current user object (null if not logged in)
  // Contains: id, email, user_metadata (like name from Google), etc.
  user: User | null

  // The current session (null if not logged in)
  // Contains: access_token, refresh_token, expires_at, etc.
  session: Session | null

  // True while we're checking if there's an existing session on app load
  // Important: prevents flash of wrong UI (e.g., showing login form then immediately redirecting)
  loading: boolean

  // Auth actions - these call the functions in authApi.ts
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
}

// Types for auth form state (used by LoginForm, SignupForm, etc.)
export interface AuthFormState {
  email: string
  password: string
  confirmPassword?: string // Only for signup
}

// Types for form errors (field-specific errors as you requested)
export interface AuthFormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  general?: string // For errors not tied to a specific field
}
