import { supabase } from '@/lib/supabaseClient'
import type { PlanName, BillingInterval, Subscription, Customer } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Helper to call a Supabase Edge Function with user authentication.
 */
async function callEdgeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return { data: null, error: new Error('No active session') }
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'x-user-token': session.access_token,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const responseData = await response.json()

    if (!response.ok) {
      return { data: null, error: new Error(responseData.error || `Request failed (${response.status})`) }
    }

    return { data: responseData as T, error: null }
  } catch (error) {
    return { data: null, error: error as Error }
  }
}

/**
 * Create a Stripe Checkout session and return the URL to redirect to.
 */
export async function createCheckoutSession(
  planType: Exclude<PlanName, 'free'>,
  billingInterval: BillingInterval
) {
  return callEdgeFunction<{ url: string }>('create-checkout', {
    planType,
    billingInterval,
  })
}

/**
 * Create a Stripe Customer Portal session and return the URL.
 */
export async function createPortalSession() {
  return callEdgeFunction<{ url: string }>('create-portal')
}

/**
 * Cancel or resume the user's subscription.
 * cancelAtPeriodEnd=true → cancels at end of billing period
 * cancelAtPeriodEnd=false → resumes a pending cancellation
 */
export async function cancelSubscription(cancelAtPeriodEnd: boolean) {
  return callEdgeFunction<{ success: boolean }>('cancel-subscription', {
    cancelAtPeriodEnd,
  })
}

/**
 * Get the current user's subscription and customer data.
 */
export async function getSubscription() {
  return callEdgeFunction<{ subscription: Subscription | null; customer: Customer | null }>(
    'get-subscription'
  )
}

/**
 * Get the current user's invoices directly from Supabase (RLS handles access).
 */
export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  return { invoices: data, error }
}
