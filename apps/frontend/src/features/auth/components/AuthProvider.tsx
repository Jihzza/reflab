import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { AuthContextType } from '../types'
import {
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle as signInWithGoogleApi,
  signOut as signOutApi,
  resetPasswordForEmail,
  updateUserPassword,
  onAuthStateChange,
  getSession,
} from '../api/authApi'

// Create the context with undefined as initial value
// We'll throw an error if someone tries to use it outside of AuthProvider
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Props for the provider component
interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider - Wraps your app and provides auth state to all components
 *
 * How it works:
 * 1. On mount, it checks for an existing session (user might already be logged in)
 * 2. It subscribes to auth state changes (login, logout, token refresh, etc.)
 * 3. It exposes user, session, loading, and auth methods via context
 * 4. Any component can access this via the useAuth() hook
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // State for the current user and session
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)

  // Loading state - true until we've checked for an existing session
  // This prevents showing login form briefly before recognizing user is logged in
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    // This handles the case where user refreshes the page while logged in
    getSession().then(({ session }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Log for debugging (as mentioned in the phase doc)
      console.log('Initial session check:', session ? 'User exists' : 'No user')
    })

    // Subscribe to auth state changes
    // This handles: login, logout, token refresh, password reset, etc.
    const unsubscribe = onAuthStateChange((event, session) => {
      console.log('Auth event:', event)

      setSession(session)
      setUser(session?.user ?? null)

      // Only set loading to false after we've processed the initial session
      // (getSession above handles the initial load)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(false)
      }
    })

    // Cleanup subscription when component unmounts
    return () => {
      unsubscribe()
    }
  }, [])

  // Wrapper functions that call the API and return a consistent shape
  // These make it easier for components to handle errors

  const signIn = async (email: string, password: string) => {
    const { error } = await signInWithPassword(email, password)
    return { error: error ? new Error(error.message) : null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await signUpWithPassword(email, password)
    return { error: error ? new Error(error.message) : null }
  }

  const signInWithGoogle = async () => {
    const { error } = await signInWithGoogleApi()
    return { error: error ? new Error(error.message) : null }
  }

  const signOut = async () => {
    const { error } = await signOutApi()
    return { error: error ? new Error(error.message) : null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await resetPasswordForEmail(email)
    return { error: error ? new Error(error.message) : null }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await updateUserPassword(newPassword)
    return { error: error ? new Error(error.message) : null }
  }

  // The value that will be available to all components via useAuth()
  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth - Hook to access auth state and methods from any component
 *
 * Usage:
 *   const { user, signIn, signOut } = useAuth()
 *
 * Throws an error if used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
