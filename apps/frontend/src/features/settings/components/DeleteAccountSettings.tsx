import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/components/AuthContext";
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
    <div className="rl-card p-6 border border-[rgba(229,57,53,0.35)]">
      <h2 className="rl-h3 text-[var(--error)] mb-2">Danger Zone</h2>
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      {/* Error message */}
      {error && (
        <div className="mb-4 rl-alert rl-alert-error text-sm">
          {error}
        </div>
      )}

      {!showConfirmation ? (
        // Delete button
        <button
          onClick={handleDeleteClick}
          className="rl-btn rl-btn-danger"
        >
          Delete Account
        </button>
      ) : (
        // Confirmation dialog
        <div className="rl-alert rl-alert-error">
          <h3 className="text-lg font-semibold mb-2">
            Are you absolutely sure?
          </h3>
          <p className="text-sm mb-4">
            This action cannot be undone. This will permanently delete your account and remove
            all of your data from our servers.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleConfirmDelete}
              disabled={loading}
              className="rl-btn rl-btn-danger"
            >
              {loading ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="rl-btn rl-btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
