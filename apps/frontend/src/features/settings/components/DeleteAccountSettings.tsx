import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { deleteAccount } from "@/features/auth/api/accountApi";

/**
 * DeleteAccountSettings - Delete account permanently
 *
 * Features:
 * - Red "Delete Account" button in danger zone
 * - Confirmation dialog: "Are you absolutely sure?"
 * - Calls deleteAccount() from accountApi (Edge Function)
 * - On success: signOut() and navigate to "/"
 * - Inline error display
 */
export default function DeleteAccountSettings() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteClick = () => {
    setShowConfirmation(true);
    setError(null);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError(null);

    // Call the Edge Function to delete account
    const { error: deleteError } = await deleteAccount();

    if (deleteError) {
      setLoading(false);
      setError(deleteError.message);
      return;
    }

    // Success - sign out and redirect to landing page
    console.log("[DeleteAccountSettings] Account deleted successfully");
    await signOut();
    navigate("/");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
      <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
      <p className="text-sm text-gray-600 mb-4">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {!showConfirmation ? (
        // Delete button
        <button
          onClick={handleDeleteClick}
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Delete Account
        </button>
      ) : (
        // Confirmation dialog
        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Are you absolutely sure?
          </h3>
          <p className="text-sm text-red-700 mb-4">
            This action cannot be undone. This will permanently delete your account and remove
            all of your data from our servers.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleConfirmDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
