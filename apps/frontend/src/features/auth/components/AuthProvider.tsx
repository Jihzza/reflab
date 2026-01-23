import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { AuthContextType, AuthStatus, ProfileStatus } from '../types'
import type { Profile } from '../api/profilesApi'
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
import { getProfile, updateLastLogin, isProfileComplete } from '../api/profilesApi'
import SessionExpiredModal from './SessionExpiredModal'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Core auth state
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Status states
  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking_session')
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('loading')

  // Session expiry modal state
  const [sessionExpired, setSessionExpired] = useState(false)

  // Track if user was previously authenticated (for detecting session expiry)
  const [wasAuthenticated, setWasAuthenticated] = useState(false)

  // Fetch profile for a user
  const fetchProfile = useCallback(async (userId: string) => {
    setProfileStatus('loading')

    const { profile: fetchedProfile, error } = await getProfile(userId)

    if (error) {
      console.error('Failed to fetch profile:', error)
      setProfile(null)
      setProfileStatus('incomplete')
      return
    }

    setProfile(fetchedProfile)

    // Determine profile status based on completion (custom username + name)
    if (isProfileComplete(fetchedProfile)) {
      setProfileStatus('complete')
    } else {
      setProfileStatus('incomplete')
    }
  }, [])

  // Refresh profile (callable from outside, e.g., after setting username)
  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }, [user?.id, fetchProfile])

  // Dismiss session expired modal
  const dismissSessionExpired = useCallback(() => {
    setSessionExpired(false)
  }, [])

  useEffect(() => {
    // Check for existing session on mount
    getSession().then(async ({ session }) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        setAuthStatus('authenticated')
        setWasAuthenticated(true)
        await fetchProfile(session.user.id)

        // Update last login timestamp
        updateLastLogin(session.user.id)
      } else {
        setAuthStatus('unauthenticated')
        setProfileStatus('loading')
      }

      console.log('Initial session check:', session ? 'User exists' : 'No user')
    })

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event)

      setSession(session)
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        setAuthStatus('authenticated')
        setWasAuthenticated(true)
        await fetchProfile(session.user.id)

        // Update last login timestamp
        updateLastLogin(session.user.id)
      }

      if (event === 'SIGNED_OUT') {
        // Check if this was an unexpected sign out (session expiry)
        if (wasAuthenticated) {
          setSessionExpired(true)
        }

        setAuthStatus('unauthenticated')
        setProfile(null)
        setProfileStatus('loading')
        setWasAuthenticated(false)
      }

      if (event === 'TOKEN_REFRESHED') {
        // Session was refreshed, keep current state
        console.log('Token refreshed successfully')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [fetchProfile, wasAuthenticated])

  // Auth action wrappers
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
    // Intentional sign out - don't show expired modal
    setWasAuthenticated(false)
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

  const value: AuthContextType = {
    user,
    session,
    profile,
    authStatus,
    profileStatus,
    loading: authStatus === 'checking_session',
    sessionExpired,
    dismissSessionExpired,
    refreshProfile,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredModal
        isOpen={sessionExpired}
        onClose={dismissSessionExpired}
      />
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
