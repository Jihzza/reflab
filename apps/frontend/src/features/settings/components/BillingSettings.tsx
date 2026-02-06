import { useState } from 'react'
import { useSubscription } from '@/features/billing/hooks/useSubscription'
import { useFeatureAccess } from '@/features/billing/hooks/useFeatureAccess'
import { createPortalSession, cancelSubscription } from '@/features/billing/api/billingApi'
import { getPlanConfig, PLANS } from '@/config/plans'

/**
 * BillingSettings - Subscription and billing management section for Settings page.
 *
 * Shows:
 * - Current plan name and status
 * - Test usage counter
 * - Manage subscription button (opens Stripe Portal)
 * - Cancel/resume subscription
 * - Upgrade CTA for free users
 */
export default function BillingSettings() {
  const { subscription, plan, loading: subLoading } = useSubscription()
  const { testsUsed, limit, loading: accessLoading } = useFeatureAccess()
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const planConfig = getPlanConfig(plan)
  const loading = subLoading || accessLoading

  const handleManageBilling = async () => {
    setActionLoading(true)
    setError(null)

    const { data, error: portalError } = await createPortalSession()
    if (portalError || !data?.url) {
      setError(portalError?.message || 'Failed to open billing portal')
      setActionLoading(false)
      return
    }

    window.location.href = data.url
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.')) {
      return
    }

    setActionLoading(true)
    setError(null)

    const { error: cancelError } = await cancelSubscription(true)
    if (cancelError) {
      setError(cancelError.message)
      setActionLoading(false)
      return
    }

    window.location.reload()
  }

  const handleResumeSubscription = async () => {
    setActionLoading(true)
    setError(null)

    const { error: resumeError } = await cancelSubscription(false)
    if (resumeError) {
      setError(resumeError.message)
      setActionLoading(false)
      return
    }

    window.location.reload()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing & Subscription</h2>
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing & Subscription</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Current plan info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Current plan</span>
          <span className="font-semibold text-gray-900 capitalize">{planConfig.label}</span>
        </div>

        {subscription && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status</span>
              <span className={`font-semibold ${
                subscription.status === 'active' ? 'text-green-600' :
                subscription.status === 'past_due' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {subscription.status === 'active' ? 'Active' :
                 subscription.status === 'past_due' ? 'Past Due' :
                 subscription.status}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Billing</span>
              <span className="text-gray-900 capitalize">{subscription.plan_type}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-600">Next billing date</span>
              <span className="text-gray-900">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Your subscription will cancel on {new Date(subscription.current_period_end).toLocaleDateString()}.
                You will keep access until then.
              </div>
            )}
          </>
        )}

        {/* Test usage counter */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Tests this month</span>
          <span className="text-gray-900">
            {testsUsed} / {limit === Infinity ? 'Unlimited' : limit}
          </span>
        </div>

        {/* Usage bar for limited plans */}
        {limit !== Infinity && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                testsUsed >= limit ? 'bg-red-500' : testsUsed >= limit * 0.8 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, (testsUsed / limit) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {subscription && !subscription.cancel_at_period_end ? (
          <>
            <button
              onClick={handleManageBilling}
              disabled={actionLoading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {actionLoading ? 'Loading...' : 'Manage Billing'}
            </button>
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading}
              className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-md font-medium hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel Subscription
            </button>
          </>
        ) : subscription?.cancel_at_period_end ? (
          <button
            onClick={handleResumeSubscription}
            disabled={actionLoading}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {actionLoading ? 'Loading...' : 'Resume Subscription'}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">
              Upgrade to get more tests and premium features.
            </p>
            <div className="flex gap-3">
              <a
                href="/#pricing"
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md font-medium text-center hover:bg-gray-50"
              >
                {PLANS.standard.label} - {'\u20AC'}{PLANS.standard.monthlyPrice}/mo
              </a>
              <a
                href="/#pricing"
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md font-medium text-center hover:bg-blue-700"
              >
                {PLANS.pro.label} - {'\u20AC'}{PLANS.pro.monthlyPrice}/mo
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
