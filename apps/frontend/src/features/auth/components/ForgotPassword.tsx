import { useState } from "react";
import { useAuth } from "./AuthProvider";
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
          <div className="p-4 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            If an account exists with this email, you will receive a password reset link shortly.
          </div>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2 px-4 border border-gray-300 bg-white text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to login
          </button>
        </div>
      ) : (
        // Form state
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Reset your password</h2>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* General error message */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {errors.general}
            </div>
          )}

          {/* Email field */}
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="you@example.com"
              disabled={loading}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>

          {/* Back to login */}
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2 px-4 border border-gray-300 bg-white text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={loading}
          >
            Back to login
          </button>
        </form>
      )}
    </div>
  );
}
