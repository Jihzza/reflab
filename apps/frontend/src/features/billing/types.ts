export type PlanName = 'free' | 'standard' | 'pro'
export type BillingInterval = 'monthly' | 'yearly'
export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'trialing'
  | 'unpaid'
  | 'paused'

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  status: SubscriptionStatus
  price_id: string
  plan_type: BillingInterval
  plan_name: Exclude<PlanName, 'free'>
  cancel_at_period_end: boolean
  current_period_start: string
  current_period_end: string
  canceled_at: string | null
  ended_at: string | null
  trial_start: string | null
  trial_end: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string
  stripe_customer_id: string
  email: string
  created_at: string
  updated_at: string
}
