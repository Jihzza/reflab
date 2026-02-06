import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { PLANS } from '@/config/plans'
import { useSubscription } from './useSubscription'

interface UseFeatureAccessReturn {
  canTakeTest: boolean
  testsUsed: number
  testsRemaining: number
  limit: number
  loading: boolean
}

/**
 * Hook to check if the current user can take a test based on their plan limits.
 *
 * Counts submitted test attempts in the current calendar month and compares
 * against the plan's monthly test limit.
 */
export function useFeatureAccess(): UseFeatureAccessReturn {
  const { user } = useAuth()
  const { plan, loading: subLoading } = useSubscription()
  const [testsUsed, setTestsUsed] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id || subLoading) return

    async function countTestsThisMonth() {
      // Get start of current month in UTC
      const now = new Date()
      const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString()

      const { count, error } = await supabase
        .from('test_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('status', 'submitted')
        .gte('submitted_at', monthStart)

      if (error) {
        console.error('[useFeatureAccess] Error counting tests:', error)
      } else {
        setTestsUsed(count ?? 0)
      }

      setLoading(false)
    }

    countTestsThisMonth()
  }, [user?.id, subLoading, plan])

  const planConfig = PLANS[plan]
  const limit = planConfig.testsPerMonth
  const testsRemaining = Math.max(0, limit - testsUsed)
  const canTakeTest = limit === Infinity || testsUsed < limit

  return {
    canTakeTest,
    testsUsed,
    testsRemaining,
    limit,
    loading: loading || subLoading,
  }
}
