import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * SessionExpiredModal - Modal shown when session expires
 *
 * Features:
 * - Displays when sessionExpired is true
 * - Modal overlay with centered content
 * - Explains session expired
 * - "Sign in again" button that dismisses modal and navigates to landing page
 * - Cannot be dismissed by clicking outside (user must click button)
 */
export default function SessionExpiredModal() {
  const navigate = useNavigate();
  const { sessionExpired, dismissSessionExpired } = useAuth();

  if (!sessionExpired) {
    return null;
  }

  const handleSignInAgain = () => {
    dismissSessionExpired();
    navigate("/");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      aria-labelledby="session-expired-title"
      aria-modal="true"
      role="dialog"
    >
      <div className="rl-card p-6 max-w-md mx-4">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-[rgba(246,168,33,0.10)] border border-[rgba(246,168,33,0.30)] rounded-full mb-4">
          <svg
            className="w-6 h-6 text-[var(--warning)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h2
          id="session-expired-title"
          className="rl-h3 text-center mb-2"
        >
          Session Expired
        </h2>

        <p className="text-[var(--text-secondary)] text-center mb-6">
          Your session has expired due to inactivity. Please sign in again to continue.
        </p>

        <button
          onClick={handleSignInAgain}
          className="rl-btn rl-btn-primary w-full"
        >
          Sign in again
        </button>
      </div>
    </div>
  );
}
