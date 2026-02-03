import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

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
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-yellow-600"
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
          className="text-xl font-semibold text-gray-900 text-center mb-2"
        >
          Session Expired
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Your session has expired due to inactivity. Please sign in again to continue.
        </p>

        <button
          onClick={handleSignInAgain}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Sign in again
        </button>
      </div>
    </div>
  );
}
