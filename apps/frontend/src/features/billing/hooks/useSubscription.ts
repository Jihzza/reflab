import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/features/auth/components/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import type { PlanName, Subscription } from '../types'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  plan: PlanName
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook to get the current user's subscription status.
 * Queries subscriptions table directly (RLS allows SELECT on own data).
 *
 * Returns plan='free' if no active subscription exists.
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null)
      setLoading(false)
      return
    }

    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .maybeSingle()

      if (fetchError) {
        console.error('[useSubscription] Error:', fetchError)
        setError(fetchError.message)
      } else {
        setSubscription(data as Subscription | null)
      }
    } catch (err) {
      console.error('[useSubscription] Unexpected error:', err)
      setError('Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const plan: PlanName = subscription?.plan_name ?? 'free'

  return {
    subscription,
    plan,
    loading,
    error,
    refresh: fetchSubscription,
  }
}
