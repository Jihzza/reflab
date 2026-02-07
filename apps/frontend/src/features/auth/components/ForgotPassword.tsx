import { useState } from "react";
import { useAuth } from "./AuthContext";
import { classifyAuthError, errorToFormErrors, logAuthError } from "../api/authErrors";
import type { AuthFormErrors } from "../types";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

/**
 * ForgotPassword - Request password reset email
 *
 * Features:
 * - Email input with validation
 * - Sends password reset email via Supabase
 * - Generic success message (security: doesn't reveal if email exists)
 * - Inline error messages
 * - Back to login button
 */
export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    // Validation
    if (!email) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!isValidEmail(email)) {
      setErrors({ email: "Please enter a valid email" });
      return;
    }

    // Send password reset email
    setLoading(true);
    const { error } = await resetPasswordForEmail(email);
    setLoading(false);

    if (error) {
      // Use centralized error classification
      const classified = classifyAuthError(error, 'password_reset');
      logAuthError(classified, 'forgot_password_form');

      // Map to form errors
      const formErrors = errorToFormErrors(classified);
      setErrors(formErrors);
      return;
    }

    // Show generic success message (don't reveal if email exists)
    setSuccess(true);
    console.log("[ForgotPassword] Password reset email sent");
  };

  return (
    <div className="w-full">
      {success ? (
        // Success state
        <div className="space-y-4">
          <div className="rl-alert rl-alert-success text-sm">
            If an account exists with this email, you will receive a password reset link shortly.
          </div>
          <button
            type="button"
            onClick={onBackToLogin}
            className="rl-btn rl-btn-secondary w-full"
          >
            Back to login
          </button>
        </div>
      ) : (
        // Form state
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="rl-h3 mb-2">Reset your password</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* General error message */}
          {errors.general && (
            <div className="rl-alert rl-alert-error text-sm">
              {errors.general}
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="reset-email" className="rl-label">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rl-input"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              disabled={loading}
            />
            {errors.email && <p className="mt-1 text-sm text-[var(--error)]">{errors.email}</p>}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="rl-btn rl-btn-primary w-full"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>

          {/* Back to login */}
          <button
            type="button"
            onClick={onBackToLogin}
            className="rl-btn rl-btn-secondary w-full"
            disabled={loading}
          >
            Back to login
          </button>
        </form>
      )}
    </div>
  );
}
