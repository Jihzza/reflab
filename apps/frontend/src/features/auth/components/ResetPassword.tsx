import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
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
  const checkingSession = authStatus === "checking_session";
  const linkError =
    !checkingSession && !user
      ? "Invalid or expired password reset link. Please request a new one from the login page."
      : null;
  const generalError = errors.general || linkError;

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
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rl-card p-8">
          {checkingSession ? (
            // Loading state while checking for recovery session
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 border-4 border-[rgba(255,229,138,0.22)] border-t-[var(--brand-yellow)] rounded-full animate-spin" />
              <p className="text-[var(--text-secondary)]">Verifying reset link...</p>
            </div>
          ) : success ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-[rgba(61,220,151,0.10)] rounded-full flex items-center justify-center border border-[rgba(61,220,151,0.30)]">
                <svg
                  className="w-6 h-6 text-[var(--success)]"
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
              <h2 className="rl-h3">Password Updated</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Your password has been successfully updated. Redirecting to dashboard...
              </p>
            </div>
          ) : (
            // Form state
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="rl-h2 mb-2">Set new password</h2>
                <p className="text-sm text-[var(--text-secondary)]">Enter your new password below.</p>
              </div>

              {/* General error message */}
              {generalError && (
                <div className="rl-alert rl-alert-error text-sm">
                  {generalError}
                </div>
              )}

              {/* Only show form if we have a valid user session */}
              {user && (
                <>
                  {/* New Password field */}
                  <div>
                    <label
                      htmlFor="new-password"
                      className="rl-label"
                    >
                      New Password
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="rl-input"
                      placeholder="At least 6 characters"
                      aria-invalid={!!errors.password}
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-[var(--error)]">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password field */}
                  <div>
                    <label
                      htmlFor="confirm-password"
                      className="rl-label"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="rl-input"
                      placeholder="••••••••"
                      aria-invalid={!!errors.confirmPassword}
                      disabled={loading}
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-[var(--error)]">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="rl-btn rl-btn-primary w-full"
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
                  className="rl-btn rl-btn-secondary w-full"
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
