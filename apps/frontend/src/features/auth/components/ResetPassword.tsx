import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { classifyAuthError, errorToFormErrors, logAuthError } from "../api/authErrors";
import type { AuthFormErrors } from "../types";

/**
 * ResetPassword - Set new password after clicking reset link
 *
 * Features:
 * - Detects password recovery session automatically
 * - New password and confirm password fields with validation
 * - Updates user password via Supabase
 * - Success message with auto-redirect
 * - Error handling for invalid/expired links
 * - Inline error messages
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, authStatus, updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Check if user has a valid recovery session
  useEffect(() => {
    // Wait for session check to complete
    if (authStatus === "checking_session") {
      setCheckingSession(true);
      return;
    }

    setCheckingSession(false);

    if (!user) {
      // No recovery session detected after check completed
      setErrors({
        general:
          "Invalid or expired password reset link. Please request a new one from the login page.",
      });
    } else {
      console.log("[ResetPassword] Recovery session detected for:", user.email);
    }
  }, [user, authStatus]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: AuthFormErrors = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update password
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      // Use centralized error classification
      const classified = classifyAuthError(error, 'password_update');
      logAuthError(classified, 'reset_password_form');

      // Map to form errors
      const formErrors = errorToFormErrors(classified);
      setErrors(formErrors);
      return;
    }

    // Success - show message and redirect
    setSuccess(true);
    console.log("[ResetPassword] Password updated successfully");

    // Redirect to dashboard after 2 seconds
    setTimeout(() => {
      navigate("/app/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          {checkingSession ? (
            // Loading state while checking for recovery session
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Verifying reset link...</p>
            </div>
          ) : success ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Password Updated</h2>
              <p className="text-sm text-gray-600">
                Your password has been successfully updated. Redirecting to dashboard...
              </p>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Set new password</h2>
                <p className="text-sm text-gray-600">Enter your new password below.</p>
              </div>

              {/* General error message */}
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {errors.general}
                </div>
              )}

              {/* Only show form if we have a valid user session */}
              {user && (
                <>
                  {/* New Password field */}
                  <div>
                    <label
                      htmlFor="new-password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.password
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="At least 6 characters"
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.confirmPassword
                          ? "border-red-300 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Updating..." : "Update password"}
                  </button>
                </>
              )}

              {/* Back to login link */}
              {!user && (
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="w-full py-2 px-4 border border-gray-300 bg-white text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Back to login
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
