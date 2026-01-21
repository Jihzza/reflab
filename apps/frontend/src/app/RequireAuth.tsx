import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/components/AuthProvider";

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * Auth guard for protected routes.
 *
 * This component wraps routes that require authentication.
 * It checks the auth state from AuthProvider and:
 * 1. Shows a loading indicator while checking for existing session
 * 2. Redirects to landing page if no user is logged in
 * 3. Renders the protected content if user is authenticated
 *
 * Usage in Router.tsx:
 *   <Route element={<RequireAuth><AppShell /></RequireAuth>}>
 *     <Route path="dashboard" element={<DashboardPage />} />
 *   </Route>
 */
export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  // While checking for existing session, show a loading state
  // This prevents a flash of the login page when the user is actually logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // No user logged in - redirect to landing page
  // The landing page will have the login/signup forms
  if (!user) {
    // `replace` prevents the protected route from being added to history
    // So when user logs in, they won't go "back" to a redirect loop
    return <Navigate to="/" replace />;
  }

  // User is authenticated - render the protected content
  return <>{children}</>;
}
