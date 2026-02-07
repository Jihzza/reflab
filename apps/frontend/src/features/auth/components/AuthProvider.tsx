import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { AuthContextType, AuthStatus } from "../types";
import * as authApi from "../api/authApi";
import SessionExpiredModal from "./SessionExpiredModal";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider - Manages authentication state and session
 *
 * Responsibilities:
 * - Initialize session on mount
 * - Subscribe to auth state changes (sign in, sign out, token refresh, etc.)
 * - Provide auth methods to the app
 * - Handle session expiry detection
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking_session");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    console.log("[AuthProvider] Initializing session check...");

    authApi
      .getSession()
      .then(({ session, error }) => {
        if (error) {
          console.error("[AuthProvider] Session check error:", error);
          setAuthStatus("error");
          return;
        }

        if (session) {
          console.log("[AuthProvider] Active session found:", session.user.email);
          setUser(session.user);
          setSession(session);
          setAuthStatus("authenticated");
          setWasAuthenticated(true);
        } else {
          console.log("[AuthProvider] No active session");
          setAuthStatus("unauthenticated");
        }
      })
      .catch((err) => {
        console.error("[AuthProvider] Unexpected error:", err);
        setAuthStatus("error");
      });
  }, []);

  // Subscribe to auth state changes
  useEffect(() => {
    console.log("[AuthProvider] Setting up auth state listener...");

    const unsubscribe = authApi.onAuthStateChange((event, session) => {
      console.log(`[AuthProvider] Auth event: ${event}`, {
        hasSession: !!session,
        email: session?.user?.email,
      });

      switch (event) {
        case "SIGNED_IN":
          setUser(session?.user ?? null);
          setSession(session);
          setAuthStatus("authenticated");
          setWasAuthenticated(true);
          setSessionExpired(false);
          break;

        case "SIGNED_OUT":
          setUser(null);
          setSession(null);
          setAuthStatus("unauthenticated");
          // If user was authenticated and now signed out, flag session expiry
          if (wasAuthenticated) {
            console.log("[AuthProvider] Session expired detected");
            setSessionExpired(true);
          }
          break;

        case "TOKEN_REFRESHED":
          console.log("[AuthProvider] Token refreshed successfully");
          setSession(session);
          break;

        case "USER_UPDATED":
          console.log("[AuthProvider] User data updated");
          setUser(session?.user ?? null);
          setSession(session);
          break;

        case "PASSWORD_RECOVERY":
          console.log("[AuthProvider] Password recovery initiated");
          setUser(session?.user ?? null);
          setSession(session);
          break;

        default:
          console.log(`[AuthProvider] Unhandled event: ${event}`);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("[AuthProvider] Cleaning up auth listener");
      unsubscribe();
    };
  }, [wasAuthenticated]);

  // Auth methods
  const signIn = async (email: string, password: string) => {
    const { error } = await authApi.signInWithPassword(email, password);
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await authApi.signUpWithPassword(email, password);
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await authApi.signInWithGoogle();
    return { error };
  };

  const signOut = async () => {
    await authApi.signOut();
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await authApi.resetPasswordForEmail(email);
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await authApi.updateUserPassword(newPassword);
    return { error };
  };

  const dismissSessionExpired = () => {
    setSessionExpired(false);
    setWasAuthenticated(false);
  };

  const value: AuthContextType = {
    user,
    session,
    authStatus,
    sessionExpired,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPasswordForEmail,
    updatePassword,
    dismissSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionExpiredModal />
    </AuthContext.Provider>
  );
}
