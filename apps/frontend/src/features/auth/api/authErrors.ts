/**
 * Centralized authentication error handling
 * Provides typed error kinds, classification, and user-friendly messages
 *
 * This replaces string matching (error.message.includes()) throughout the app
 * with a type-safe, centralized error classification system.
 */


// Error kind constants for type-safe error handling
export const AuthErrorKind = {
  // Authentication errors
  INVALID_CREDENTIALS: 'invalid_credentials',
  USER_EXISTS: 'user_exists',
  WEAK_PASSWORD: 'weak_password',

  // Session errors
  SESSION_EXPIRED: 'session_expired',
  INVALID_TOKEN: 'invalid_token',

  // Rate limiting
  RATE_LIMITED: 'rate_limited',

  // Network errors
  NETWORK_ERROR: 'network_error',
  TIMEOUT: 'timeout',

  // Validation errors
  INVALID_EMAIL: 'invalid_email',
  INVALID_PASSWORD: 'invalid_password',

  // OAuth errors
  OAUTH_ERROR: 'oauth_error',
  OAUTH_CANCELLED: 'oauth_cancelled',

  // Username/profile errors
  USERNAME_TAKEN: 'username_taken',
  USERNAME_INVALID: 'username_invalid',

  // Generic
  UNKNOWN: 'unknown',
} as const;

export type AuthErrorKind = (typeof AuthErrorKind)[keyof typeof AuthErrorKind];

// Typed error information
export interface ClassifiedError {
  kind: AuthErrorKind;
  message: string; // User-friendly message
  technical?: string; // Technical details for logging
  field?: 'email' | 'password' | 'username' | 'confirmPassword' | 'general'; // Which field to show error on
  retryable: boolean; // Can user retry the operation?
}

/**
 * Classify Supabase auth errors into typed error kinds
 * Uses error.status, error.code, and error.name (not string matching!)
 * Falls back to string patterns only when needed
 *
 * @param error - The error from Supabase or generic Error
 * @param context - Context helps provide appropriate generic messages
 * @returns Classified error with user-friendly message
 */
export function classifyAuthError(
  error: any,
  context?: 'login' | 'signup' | 'oauth' | 'password_reset' | 'password_update' | 'username_update'
): ClassifiedError {
  if (!error) {
    return {
      kind: AuthErrorKind.UNKNOWN,
      message: 'An unexpected error occurred',
      retryable: true,
      field: 'general',
    };
  }

  // 1. Check for HTTP status codes (most reliable)
  if ('status' in error) {
    // Rate limiting (HTTP 429)
    if (error.status === 429) {
      return {
        kind: AuthErrorKind.RATE_LIMITED,
        message: 'Too many attempts. Please wait a few minutes before trying again.',
        technical: error.message,
        retryable: false,
        field: 'general',
      };
    }

    // Unauthorized (HTTP 401)
    if (error.status === 401) {
      return {
        kind: AuthErrorKind.INVALID_CREDENTIALS,
        message: getGenericAuthMessage(context),
        technical: error.message,
        retryable: true,
        field: 'general',
      };
    }

    // Conflict (HTTP 409) - Usually duplicate user
    if (error.status === 409) {
      return {
        kind: AuthErrorKind.USER_EXISTS,
        message: context === 'username_update'
          ? 'Username is already taken'
          : 'An account with this email already exists',
        technical: error.message,
        retryable: false,
        field: context === 'username_update' ? 'username' : 'email',
      };
    }
  }

  // 2. Check for Supabase error codes (preferred over string matching)
  if ('code' in error && typeof error.code === 'string') {
    switch (error.code) {
      case 'invalid_credentials':
      case 'invalid_grant':
        return {
          kind: AuthErrorKind.INVALID_CREDENTIALS,
          message: getGenericAuthMessage(context),
          technical: error.message,
          retryable: true,
          field: 'general',
        };

      case 'user_already_exists':
      case 'email_exists':
        return {
          kind: AuthErrorKind.USER_EXISTS,
          message: 'An account with this email already exists',
          technical: error.message,
          retryable: false,
          field: 'email',
        };

      case 'weak_password':
        return {
          kind: AuthErrorKind.WEAK_PASSWORD,
          message: 'Password is too weak. Please use a stronger password.',
          technical: error.message,
          retryable: true,
          field: 'password',
        };

      case 'over_request_rate_limit':
      case 'over_email_send_rate_limit':
        return {
          kind: AuthErrorKind.RATE_LIMITED,
          message: 'Too many attempts. Please wait a few minutes before trying again.',
          technical: error.message,
          retryable: false,
          field: 'general',
        };

      case 'validation_failed':
      case 'invalid_email':
        return {
          kind: AuthErrorKind.INVALID_EMAIL,
          message: 'Please enter a valid email address',
          technical: error.message,
          retryable: true,
          field: 'email',
        };

      case 'session_not_found':
      case 'refresh_token_not_found':
        return {
          kind: AuthErrorKind.SESSION_EXPIRED,
          message: 'Your session has expired. Please sign in again.',
          technical: error.message,
          retryable: true,
          field: 'general',
        };
    }
  }

  // 3. Check for network errors
  if (error.message) {
    const msg = error.message.toLowerCase();

    if (msg.includes('failed to fetch') || msg.includes('network error') || msg.includes('network request failed')) {
      return {
        kind: AuthErrorKind.NETWORK_ERROR,
        message: 'Network error. Please check your connection and try again.',
        technical: error.message,
        retryable: true,
        field: 'general',
      };
    }

    if (msg.includes('timeout')) {
      return {
        kind: AuthErrorKind.TIMEOUT,
        message: 'Request timed out. Please try again.',
        technical: error.message,
        retryable: true,
        field: 'general',
      };
    }
  }

  // 4. Fallback: pattern matching as last resort (for backwards compatibility)
  // Prefer error codes above!
  if (error.message) {
    const msg = error.message.toLowerCase();

    // Invalid credentials patterns
    if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid email or password')) {
      return {
        kind: AuthErrorKind.INVALID_CREDENTIALS,
        message: getGenericAuthMessage(context),
        technical: error.message,
        retryable: true,
        field: 'general',
      };
    }

    // User exists patterns
    if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already exists')) {
      return {
        kind: AuthErrorKind.USER_EXISTS,
        message: 'An account with this email already exists',
        technical: error.message,
        retryable: false,
        field: 'email',
      };
    }

    // Username taken patterns
    if (msg.includes('already taken') || msg.includes('username') && msg.includes('exists')) {
      return {
        kind: AuthErrorKind.USERNAME_TAKEN,
        message: 'Username is already taken',
        technical: error.message,
        retryable: false,
        field: 'username',
      };
    }

    // Session/token expired
    if (msg.includes('session') && (msg.includes('expired') || msg.includes('invalid'))) {
      return {
        kind: AuthErrorKind.SESSION_EXPIRED,
        message: 'Your session has expired. Please sign in again.',
        technical: error.message,
        retryable: true,
        field: 'general',
      };
    }

    // OAuth errors
    if (msg.includes('oauth') || msg.includes('authorization')) {
      return {
        kind: AuthErrorKind.OAUTH_ERROR,
        message: 'Authentication failed. Please try again.',
        technical: error.message,
        retryable: true,
        field: 'general',
      };
    }
  }

  // 5. Unknown error
  return {
    kind: AuthErrorKind.UNKNOWN,
    message: 'Something went wrong. Please try again.',
    technical: error.message || String(error),
    retryable: true,
    field: 'general',
  };
}

/**
 * Get generic authentication error messages to prevent user enumeration
 * Different contexts may have different generic messages
 *
 * SECURITY: These messages intentionally don't reveal whether:
 * - Email exists in database
 * - Password is wrong
 * - Account is disabled
 */
function getGenericAuthMessage(context?: string): string {
  switch (context) {
    case 'login':
      // Don't reveal whether email exists or password is wrong
      return 'Invalid email or password';

    case 'password_reset':
      // Always say "if account exists" to prevent enumeration
      return 'If an account with this email exists, you will receive a password reset link';

    case 'oauth':
      return 'Authentication failed. Please try again.';

    case 'password_update':
      return 'Failed to update password. Please try again.';

    case 'username_update':
      return 'Failed to update username. Please try again.';

    default:
      return 'Invalid email or password';
  }
}

/**
 * Map classified error to form field errors
 * Useful for setting React state in forms
 */
export function errorToFormErrors(error: ClassifiedError): {
  email?: string;
  password?: string;
  username?: string;
  confirmPassword?: string;
  general?: string;
} {
  const errors: any = {};

  if (error.field && error.message) {
    errors[error.field] = error.message;
  }

  return errors;
}

/**
 * Check if error is retryable (for UI feedback)
 * Non-retryable errors: rate limiting, user already exists
 */
export function isRetryable(error: ClassifiedError): boolean {
  return error.retryable;
}

/**
 * Log error for debugging (production-safe)
 * In development: logs to console
 * In production: could send to error monitoring service
 */
export function logAuthError(error: ClassifiedError, context: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Auth Error - ${context}]`, {
      kind: error.kind,
      message: error.message,
      technical: error.technical,
      field: error.field,
      retryable: error.retryable,
    });
  }

  // In production, send to error monitoring service
  // Example: Sentry.captureException(error)
  // Example: LogRocket.captureException(error)
}
