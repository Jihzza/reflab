import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { getProfile, updateUsername } from "@/features/auth/api/profilesApi";
import { classifyAuthError, logAuthError } from "@/features/auth/api/authErrors";

interface UsernameErrors {
  username?: string;
  general?: string;
}

/**
 * UsernameSettings - Update username from account settings
 *
 * Features:
 * - Display current username
 * - New username input with validation (3-30 chars, alphanumeric + underscore/dot)
 * - Calls updateUsername() from profilesApi
 * - Success/error messages (inline, no toasts)
 * - Handles duplicate username error
 */
export default function UsernameSettings() {
  const { user } = useAuth();

  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [newUsername, setNewUsername] = useState("");
  const [errors, setErrors] = useState<UsernameErrors>({});
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [success, setSuccess] = useState(false);

  // Load current username on mount
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { profile, error } = await getProfile(user.id);
      setLoadingProfile(false);

      if (error || !profile) {
        console.error("[UsernameSettings] Failed to load profile:", error);
        return;
      }

      setCurrentUsername(profile.username);
    };

    loadProfile();
  }, [user]);

  // Validate username format
  const isValidUsername = (username: string) => {
    // 3-30 characters, alphanumeric + underscore/dot
    return /^[a-zA-Z0-9_.]{3,30}$/.test(username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    if (!user) {
      setErrors({ general: "You must be logged in to update your username" });
      return;
    }

    // Validation
    const newErrors: UsernameErrors = {};

    if (!newUsername) {
      newErrors.username = "Username is required";
    } else if (!isValidUsername(newUsername)) {
      newErrors.username =
        "Username must be 3-30 characters and contain only letters, numbers, underscores, and dots";
    } else if (newUsername.toLowerCase() === currentUsername.toLowerCase()) {
      newErrors.username = "New username must be different from current username";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Update username
    setLoading(true);
    const { profile, error } = await updateUsername(user.id, newUsername);
    setLoading(false);

    if (error) {
      // Use centralized error classification
      const classified = classifyAuthError(error, 'username_update');
      logAuthError(classified, 'username_settings');

      // Set error on appropriate field
      if (classified.field === 'username') {
        setErrors({ username: classified.message });
      } else {
        setErrors({ general: classified.message });
      }
      return;
    }

    // Success
    if (profile) {
      setSuccess(true);
      setCurrentUsername(profile.username);
      setNewUsername("");
      console.log("[UsernameSettings] Username updated successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    }
  };

  if (loadingProfile) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Username</h2>

      {/* Current username display */}
      <div className="mb-6 p-3 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-600">Current username:</p>
        <p className="text-lg font-medium text-gray-800">{currentUsername}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Success message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            Username updated successfully!
          </div>
        )}

        {/* General error message */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {errors.general}
          </div>
        )}

        {/* New Username field */}
        <div>
          <label htmlFor="new-username" className="block text-sm font-medium text-gray-700 mb-1">
            New Username
          </label>
          <input
            id="new-username"
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.username
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="3-30 characters (a-z, 0-9, _, .)"
            disabled={loading}
          />
          {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating..." : "Update Username"}
        </button>
      </form>
    </div>
  );
}
