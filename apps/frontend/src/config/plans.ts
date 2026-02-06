import type { PlanName } from '@/features/billing/types'

export interface PlanConfig {
  name: PlanName
  label: string
  testsPerMonth: number
  monthlyPrice: number    // in EUR
  yearlyPrice: number     // in EUR (total per year)
  features: string[]
}

export const PLANS: Record<PlanName, PlanConfig> = {
  free: {
    name: 'free',
    label: 'Free',
    testsPerMonth: 3,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '3 tests per month',
      'Basic test explanations',
      'Community access',
    ],
  },
  standard: {
    name: 'standard',
    label: 'Standard',
    testsPerMonth: 15,
    monthlyPrice: 9.99,
    yearlyPrice: 95.88,
    features: [
      '15 tests per month',
      'AI-powered explanations',
      'Priority support',
      'Progress tracking',
    ],
  },
  pro: {
    name: 'pro',
    label: 'Pro',
    testsPerMonth: Infinity,
    monthlyPrice: 19.99,
    yearlyPrice: 191.88,
    features: [
      'Unlimited tests',
      'AI-powered explanations',
      'Priority support',
      'Progress tracking',
      'Advanced analytics',
      'Early access to new features',
    ],
  },
}

/**
 * Get the plan config for a given plan name.
 * Defaults to 'free' if not found.
 */
export function getPlanConfig(planName: PlanName | string | null): PlanConfig {
  if (planName && planName in PLANS) {
    return PLANS[planName as PlanName]
  }
  return PLANS.free
}
