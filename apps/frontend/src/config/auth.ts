/**
 * Centralized authentication configuration
 * Manages URLs, redirects, and environment-specific settings
 *
 * This replaces hardcoded window.location.origin calls throughout the app
 */

// Get base URL based on environment
const getBaseUrl = (): string => {
  // In production, use environment variable or window.location.origin
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_APP_URL || window.location.origin;
  }

  // In development, use localhost
  return import.meta.env.VITE_APP_URL || 'http://localhost:5173';
};

export const AUTH_CONFIG = {
  // Base URLs
  baseUrl: getBaseUrl(),

  // Redirect destinations (paths only, not full URLs)
  redirects: {
    afterLogin: '/app/dashboard',
    afterSignup: '/app/dashboard',
    afterOAuth: '/app/dashboard', // After OAuth callback completes
    afterPasswordReset: '/reset-password', // Where reset email link points
    onSessionExpired: '/',
    onUnauthorized: '/',
  },

  // OAuth configuration
  oauth: {
    // Google OAuth settings
    google: {
      // Full callback URL for OAuth redirect
      get redirectTo() {
        return `${getBaseUrl()}/auth/callback`;
      },
    },
  },

  // Validation rules
  validation: {
    minPasswordLength: 6,
    usernamePattern: /^[a-zA-Z0-9_.]{3,30}$/,
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  // Security settings
  security: {
    enableRateLimitDetection: true,
    preventUserEnumeration: true,
  },
} as const;

/**
 * Get full redirect URL for a given redirect key
 * @param path - Key from AUTH_CONFIG.redirects
 * @returns Full URL with baseUrl + path
 */
export const getRedirectUrl = (path: keyof typeof AUTH_CONFIG.redirects): string => {
  return `${AUTH_CONFIG.baseUrl}${AUTH_CONFIG.redirects[path]}`;
};
