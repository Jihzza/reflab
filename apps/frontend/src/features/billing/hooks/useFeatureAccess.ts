import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/components/AuthContext'
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
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [testsUsed, setTestsUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const userId = user?.id

  useEffect(() => {
    if (!userId || subLoading) return

    async function countTestsThisMonth() {
      setLoading(true)
      // Admins have unlimited access.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .limit(1)
        .maybeSingle()

      if (profileError) {
        console.error('[useFeatureAccess] Error fetching profile role:', profileError)
      }

      setIsAdmin(profile?.role === 'admin')

      // Get start of current month in UTC
      const now = new Date()
      const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString()

      const { count, error } = await supabase
        .from('test_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
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
  }, [userId, subLoading, plan])

  const planConfig = PLANS[plan]
  const limit = isAdmin ? Infinity : planConfig.testsPerMonth
  const testsRemaining = limit === Infinity ? Infinity : Math.max(0, limit - testsUsed)
  const canTakeTest = isAdmin ? true : limit === Infinity || testsUsed < limit

  return {
    canTakeTest,
    testsUsed,
    testsRemaining,
    limit,
    loading: loading || subLoading || isAdmin === null,
  }
}
