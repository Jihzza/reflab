import { useState } from "react";
import { useAuth } from "@/features/auth/components/AuthContext";
import { classifyAuthError, logAuthError } from "@/features/auth/api/authErrors";

interface PasswordErrors {
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

/**
 * PasswordSettings - Update password from account settings
 *
 * Features:
 * - New password and confirm password fields
 * - Inline validation (min 6 chars, passwords match)
 * - Calls updatePassword() from useAuth
 * - Success/error messages (inline, no toasts)
 */
export default function PasswordSettings() {
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    // Validation
    const newErrors: PasswordErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update password
    setLoading(true);
    const { error } = await updatePassword(newPassword);
    setLoading(false);

    if (error) {
      // Use centralized error classification
      const classified = classifyAuthError(error, 'password_update');
      logAuthError(classified, 'password_settings');

      setErrors({ general: classified.message });
      return;
    }

    // Success
    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
    console.log("[PasswordSettings] Password updated successfully");

    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(false);
    }, 3000);
  };

  return (
    <div className="rl-card p-6">
      <h2 className="rl-h3 mb-4">Change Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success message */}
        {success && (
          <div className="rl-alert rl-alert-success text-sm">
            Password updated successfully!
          </div>
        )}

        {/* General error message */}
        {errors.general && (
          <div className="rl-alert rl-alert-error text-sm">
            {errors.general}
          </div>
        )}

        {/* New Password field */}
        <div>
          <label htmlFor="new-password" className="rl-label">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rl-input"
            placeholder="At least 6 characters"
            aria-invalid={!!errors.newPassword}
            disabled={loading}
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-[var(--error)]">{errors.newPassword}</p>
          )}
        </div>

        {/* Confirm Password field */}
        <div>
          <label
            htmlFor="confirm-new-password"
            className="rl-label"
          >
            Confirm New Password
          </label>
          <input
            id="confirm-new-password"
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
          className="rl-btn rl-btn-primary"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
