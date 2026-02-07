import { useState, useEffect } from 'react';
import { AuthErrorKind } from '../api/authErrors';

/**
 * Hook to detect and manage rate limiting state
 * Provides countdown timer and prevents submissions during cooldown
 *
 * Usage:
 * ```typescript
 * const { isRateLimited, cooldownSeconds, handleError, reset } = useRateLimitDetection();
 *
 * // After error classification
 * if (classified.kind === AuthErrorKind.RATE_LIMITED) {
 *   handleError(classified.kind);
 * }
 *
 * // In UI
 * <button disabled={isRateLimited || loading}>
 *   {isRateLimited ? `Try again in ${cooldownSeconds}s` : 'Sign In'}
 * </button>
 * ```
 */
export function useRateLimitDetection(cooldownDuration: number = 60) {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const isRateLimited = cooldownSeconds > 0;

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  /**
   * Handle auth error - start cooldown if rate limited
   */
  const handleError = (errorKind: AuthErrorKind) => {
    if (errorKind === AuthErrorKind.RATE_LIMITED) {
      setCooldownSeconds(cooldownDuration);
    }
  };

  /**
   * Manually reset rate limiting state
   */
  const reset = () => {
    setCooldownSeconds(0);
  };

  return {
    isRateLimited,
    cooldownSeconds,
    handleError,
    reset,
  };
}
