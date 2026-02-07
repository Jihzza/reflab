import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { classifyAuthError, errorToFormErrors, logAuthError } from "../api/authErrors";
import type { AuthFormErrors } from "../types";

interface LoginFormProps {
  onForgotPassword: () => void;
}

/**
 * LoginForm - Email/password and Google OAuth sign-in
 *
 * Features:
 * - Email and password inputs with validation
 * - Inline error messages (no toasts)
 * - Google OAuth button
 * - Forgot password link
 * - Navigate to /app/dashboard on success
 */
export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [loading, setLoading] = useState(false);

  // Validate email format
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle email/password sign in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors: AuthFormErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Attempt sign in
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      // Use centralized error classification
      const classified = classifyAuthError(error, 'login');
      logAuthError(classified, 'login_form');

      // Map to form errors
      const formErrors = errorToFormErrors(classified);
      setErrors(formErrors);
      return;
    }

    // Success - navigate to dashboard
    console.log("[LoginForm] Sign in successful");
    navigate("/app/dashboard");
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setErrors({});
    setLoading(true);

    const { error } = await signInWithGoogle();

    if (error) {
      setLoading(false);

      // Use centralized error classification
      const classified = classifyAuthError(error, 'oauth');
      logAuthError(classified, 'login_form_oauth');

      const formErrors = errorToFormErrors(classified);
      setErrors(formErrors);
      return;
    }

    // OAuth will redirect automatically, no need to navigate
    console.log("[LoginForm] Google OAuth initiated");
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General error message */}
        {errors.general && (
          <div className="rl-alert rl-alert-error text-sm">
            {errors.general}
          </div>
        )}

        {/* Email field */}
        <div>
          <label htmlFor="email" className="rl-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rl-input"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            disabled={loading}
          />
          {errors.email && <p className="mt-1 text-sm text-[var(--error)]">{errors.email}</p>}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className="rl-label">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rl-input"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            disabled={loading}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-[var(--error)]">{errors.password}</p>
          )}
        </div>

        {/* Forgot password link */}
        <div className="text-right">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="rl-btn rl-btn-primary w-full"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full rl-divider" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[var(--bg-surface)] text-[var(--text-muted)]">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google OAuth button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="rl-btn rl-btn-secondary w-full"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
      </form>
    </div>
  );
}
