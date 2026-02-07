import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeForSession } from "../api/authApi";
import { classifyAuthError, logAuthError } from "../api/authErrors";
import { AUTH_CONFIG } from "@/config/auth";

/**
 * OAuthCallbackPage - Handles OAuth callback and PKCE code exchange
 *
 * Features:
 * - Extracts authorization code from URL
 * - Exchanges code for session tokens (PKCE flow)
 * - Handles errors with user-friendly messages
 * - Redirects to dashboard on success
 * - Provides clear loading and error states
 *
 * Route: /auth/callback
 * Called after OAuth provider redirects back to app
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log("[OAuthCallback] Processing OAuth callback...");

      // Extract code from URL
      const code = searchParams.get("code");
      const errorCode = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Handle OAuth errors (user cancelled, provider error, etc.)
      if (errorCode) {
        console.error("[OAuthCallback] OAuth error:", errorCode, errorDescription);
        const classified = classifyAuthError(
          { message: errorDescription || errorCode } as Error,
          'oauth'
        );
        logAuthError(classified, 'oauth_callback');
        setError(classified.message);
        setProcessing(false);
        return;
      }

      // No code = invalid callback
      if (!code) {
        console.error("[OAuthCallback] No authorization code in URL");
        setError("Invalid authentication callback. Please try signing in again.");
        setProcessing(false);
        return;
      }

      // Exchange code for session
      try {
        console.log("[OAuthCallback] Exchanging code for session...");
        const { data, error: exchangeError } = await exchangeCodeForSession(code);

        if (exchangeError || !data.session) {
          const classified = classifyAuthError(exchangeError, 'oauth');
          logAuthError(classified, 'oauth_code_exchange');
          setError(classified.message);
          setProcessing(false);
          return;
        }

        console.log("[OAuthCallback] Code exchange successful, user:", data.user?.email);

        // Success - redirect to dashboard
        navigate(AUTH_CONFIG.redirects.afterOAuth, { replace: true });
      } catch (err) {
        console.error("[OAuthCallback] Unexpected error during code exchange:", err);
        const classified = classifyAuthError(err as Error, 'oauth');
        logAuthError(classified, 'oauth_callback_exception');
        setError(classified.message);
        setProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rl-card p-8">
          {processing ? (
            // Loading state
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 border-4 border-[rgba(255,229,138,0.22)] border-t-[var(--brand-yellow)] rounded-full animate-spin" />
              <h2 className="rl-h3">Completing sign in...</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Please wait while we verify your account.
              </p>
            </div>
          ) : error ? (
            // Error state
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-[rgba(229,57,53,0.10)] rounded-full flex items-center justify-center border border-[rgba(229,57,53,0.30)]">
                <svg
                  className="w-6 h-6 text-[var(--error)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="rl-h3 text-center">
                Authentication Failed
              </h2>
              <div className="rl-alert rl-alert-error text-sm">
                {error}
              </div>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="rl-btn rl-btn-primary w-full"
              >
                Back to sign in
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
