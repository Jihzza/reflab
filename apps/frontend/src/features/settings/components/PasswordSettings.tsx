import { useState } from "react";
import { useAuth } from "@/features/auth/components/AuthProvider";
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            Password updated successfully!
          </div>
        )}

        {/* General error message */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {errors.general}
          </div>
        )}

        {/* New Password field */}
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.newPassword
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="At least 6 characters"
            disabled={loading}
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
          )}
        </div>

        {/* Confirm Password field */}
        <div>
          <label
            htmlFor="confirm-new-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm New Password
          </label>
          <input
            id="confirm-new-password"
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
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
