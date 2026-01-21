import { useState } from "react";
import { useAuth } from "./AuthProvider";

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

/**
 * ForgotPassword - Form to request a password reset email
 *
 * Flow:
 * 1. User enters their email
 * 2. We call Supabase resetPassword
 * 3. Supabase sends an email with a reset link
 * 4. User clicks link → goes to /reset-password page (Step 2.5)
 */
export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const { resetPassword } = useAuth();

  // Form state
  const [email, setEmail] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous state
    setError("");
    setSuccessMessage("");

    // Basic validation
    if (!email) {
      setError("Email is required");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    // Success - show message
    // Note: Supabase doesn't reveal if email exists for security reasons
    setSuccessMessage(
      "If an account exists with this email, you will receive a password reset link."
    );
    setLoading(false);
  };

  return (
    <div>
      {/* Back to login link */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="mb-4 text-sm text-blue-600 hover:text-blue-500 flex items-center gap-1"
      >
        <span>&larr;</span> Back to login
      </button>

      <h2 className="text-xl font-semibold mb-2">Reset your password</h2>
      <p className="text-gray-600 text-sm mb-4">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success message */}
        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            placeholder="you@example.com"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
