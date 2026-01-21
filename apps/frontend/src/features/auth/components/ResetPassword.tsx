import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/**
 * ResetPassword - Page for setting a new password after clicking reset link
 *
 * Flow:
 * 1. User clicks reset link in email
 * 2. Link redirects to: /reset-password#access_token=xxx&type=recovery
 * 3. Supabase client automatically parses the token (detectSessionInUrl: true)
 * 4. User is now temporarily authenticated and can set a new password
 * 5. After setting password, redirect to dashboard
 *
 * Important: This page should only be accessible via the email reset link.
 * The URL contains tokens that Supabase needs to authenticate the password change.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { updatePassword, user } = useAuth();

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Check if user arrived via reset link (they should have a session from the token)
  useEffect(() => {
    // Give Supabase a moment to process the URL tokens
    const timer = setTimeout(() => {
      // If there's no user after processing, the link might be invalid/expired
      if (!user) {
        setError(
          "Invalid or expired reset link. Please request a new password reset."
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user]);

  const validateForm = (): boolean => {
    if (!password) {
      setError("Password is required");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    const { error: updateError } = await updatePassword(password);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    // Success!
    setSuccess(true);
    setLoading(false);

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      navigate("/app/dashboard", { replace: true });
    }, 2000);
  };

  // Show success message and redirect
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            <h2 className="text-lg font-semibold mb-2">Password updated!</h2>
            <p>Redirecting you to the dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
          <p className="mt-2 text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* New password field */}
          <div>
            <label
              htmlFor="new-password"
              className="block text-sm font-medium text-gray-700"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !user}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
          </div>

          {/* Confirm password field */}
          <div>
            <label
              htmlFor="confirm-new-password"
              className="block text-sm font-medium text-gray-700"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || !user}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="••••••••"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !user}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Updating..." : "Update password"}
          </button>

          {/* Back to login link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
