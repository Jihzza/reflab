import { useNavigate } from 'react-router-dom'
import { useFeatureAccess } from '../hooks/useFeatureAccess'
import { PLANS } from '@/config/plans'
import { useSubscription } from '../hooks/useSubscription'

/**
 * UpgradePrompt - Shown when the user has reached their test limit.
 * Displays remaining tests and upgrade options.
 */
export default function UpgradePrompt() {
  const navigate = useNavigate()
  const { testsUsed, limit, canTakeTest, loading } = useFeatureAccess()
  const { plan } = useSubscription()

  if (loading || canTakeTest) return null

  const nextPlan = plan === 'free' ? PLANS.standard : PLANS.pro

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-semibold text-yellow-800 mb-1">Test limit reached</h3>
      <p className="text-sm text-yellow-700 mb-3">
        You've used {testsUsed} of {limit} tests this month on the {PLANS[plan].label} plan.
        Upgrade to get more tests.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/app/settings')}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md font-medium hover:bg-blue-700"
        >
          Upgrade to {nextPlan.label} ({'\u20AC'}{nextPlan.monthlyPrice}/mo)
        </button>
      </div>
    </div>
  )
}
