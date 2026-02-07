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
    <div className="rl-alert rl-alert-warning">
      <h3 className="font-semibold mb-1">Test limit reached</h3>
      <p className="text-sm mb-3">
        You've used {testsUsed} of {limit} tests this month on the {PLANS[plan].label} plan.
        Upgrade to get more tests.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/app/settings')}
          className="rl-btn rl-btn-primary"
        >
          Upgrade to {nextPlan.label} ({'\u20AC'}{nextPlan.monthlyPrice}/mo)
        </button>
      </div>
    </div>
  )
}
