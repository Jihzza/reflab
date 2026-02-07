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
      <div className="rl-card p-6">
        <h2 className="rl-h3 mb-4">Billing & Subscription</h2>
        <p className="text-[var(--text-muted)]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="rl-card p-6">
      <h2 className="rl-h3 mb-4">Billing & Subscription</h2>

      {error && (
        <div className="mb-4 rl-alert rl-alert-error text-sm">
          {error}
        </div>
      )}

      {/* Current plan info */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-secondary)]">Current plan</span>
          <span className="font-semibold text-[var(--text-primary)] capitalize">{planConfig.label}</span>
        </div>

        {subscription && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Status</span>
              <span className={`font-semibold ${
                subscription.status === 'active' ? 'text-[var(--success)]' :
                subscription.status === 'past_due' ? 'text-[var(--error)]' :
                'text-[var(--warning)]'
              }`}>
                {subscription.status === 'active' ? 'Active' :
                 subscription.status === 'past_due' ? 'Past Due' :
                 subscription.status}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Billing</span>
              <span className="text-[var(--text-primary)] capitalize">{subscription.plan_type}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Next billing date</span>
              <span className="text-[var(--text-primary)]">
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </span>
            </div>

            {subscription.cancel_at_period_end && (
              <div className="rl-alert rl-alert-warning text-sm">
                Your subscription will cancel on {new Date(subscription.current_period_end).toLocaleDateString()}.
                You will keep access until then.
              </div>
            )}
          </>
        )}

        {/* Test usage counter */}
        <div className="flex justify-between items-center">
          <span className="text-[var(--text-secondary)]">Tests this month</span>
          <span className="text-[var(--text-primary)]">
            {testsUsed} / {limit === Infinity ? 'Unlimited' : limit}
          </span>
        </div>

        {/* Usage bar for limited plans */}
        {limit !== Infinity && (
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                testsUsed >= limit
                  ? 'bg-[var(--error)]'
                  : testsUsed >= limit * 0.8
                    ? 'bg-[var(--warning)]'
                    : 'bg-[var(--brand-yellow)]'
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
              className="rl-btn rl-btn-primary w-full"
            >
              {actionLoading ? 'Loading...' : 'Manage Billing'}
            </button>
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading}
              className="rl-btn w-full border border-[rgba(229,57,53,0.45)] text-[var(--error)] bg-transparent hover:bg-[rgba(229,57,53,0.10)]"
            >
              Cancel Subscription
            </button>
          </>
        ) : subscription?.cancel_at_period_end ? (
          <button
            onClick={handleResumeSubscription}
            disabled={actionLoading}
            className="rl-btn w-full bg-[var(--success)] text-[#0b1020] hover:brightness-105"
          >
            {actionLoading ? 'Loading...' : 'Resume Subscription'}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)] mb-3">
              Upgrade to get more tests and premium features.
            </p>
            <div className="flex gap-3">
              <a
                href="/#pricing"
                className="flex-1 rl-btn rl-btn-secondary text-center"
              >
                {PLANS.standard.label} - {'\u20AC'}{PLANS.standard.monthlyPrice}/mo
              </a>
              <a
                href="/#pricing"
                className="flex-1 rl-btn rl-btn-primary text-center"
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
