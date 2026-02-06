import { supabase } from '@/lib/supabaseClient'
import { PLANS } from '@/config/plans'
import type { PlanName } from '@/features/billing/types'
import type { Test, TestQuestion, TestAttempt, TestAttemptAnswer, OptionLetter } from '../types'

/**
 * Fetch all active tests
 *
 * Returns tests ordered by title (alphabetically)
 * Only returns tests where is_active = true
 */
export async function getTests() {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('is_active', true)
    .order('title')

  return { data: data as Test[] | null, error }
}

/**
 * Fetch a single test by its slug
 *
 * Slug is the URL-friendly identifier (e.g., "offside-basics")
 */
export async function getTestBySlug(slug: string) {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('slug', slug)
    .single()

  return { data: data as Test | null, error }
}

/**
 * Fetch all questions for a test
 *
 * Returns questions ordered by order_index (1, 2, 3, etc.)
 */
export async function getQuestions(testId: string) {
  const { data, error } = await supabase
    .from('test_questions')
    .select('*')
    .eq('test_id', testId)
    .order('order_index')

  return { data: data as TestQuestion[] | null, error }
}

/**
 * Check if the user can take a new test based on their plan limits.
 * Returns { allowed, testsUsed, limit } or throws if not allowed.
 */
export async function checkTestAccess(userId: string): Promise<{
  allowed: boolean
  testsUsed: number
  limit: number
}> {
  // Get user's plan from subscriptions table
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_name')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  const plan: PlanName = (subscription?.plan_name as PlanName) ?? 'free'
  const limit = PLANS[plan].testsPerMonth

  // Unlimited plan → always allowed
  if (limit === Infinity) {
    return { allowed: true, testsUsed: 0, limit }
  }

  // Count submitted tests this calendar month
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString()

  const { count, error } = await supabase
    .from('test_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'submitted')
    .gte('submitted_at', monthStart)

  if (error) {
    console.error('[checkTestAccess] Error:', error)
  }

  const testsUsed = count ?? 0
  return { allowed: testsUsed < limit, testsUsed, limit }
}

/**
 * Get or create an attempt for a test
 *
 * Logic:
 * 1. Check feature access (plan test limits)
 * 2. Check if user has an existing "in_progress" attempt for this test
 * 3. If yes, return it (allows resuming)
 * 4. If no, create a new attempt
 *
 * This ensures users can pause and resume tests
 */
export async function getOrCreateAttempt(testId: string) {
  // First, get the current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  // Check for existing in-progress attempt (always allow resuming)
  const { data: existingAttempt, error: fetchError } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('test_id', testId)
    .eq('status', 'in_progress')
    .single()

  // If found, return it (resume - no limit check needed)
  if (existingAttempt) {
    return { data: existingAttempt as TestAttempt, error: null }
  }

  // If not found (PGRST116 = no rows), check limits before creating new
  if (fetchError && fetchError.code !== 'PGRST116') {
    return { data: null, error: fetchError }
  }

  // Check test access limits before creating a new attempt
  const access = await checkTestAccess(user.id)
  if (!access.allowed) {
    return {
      data: null,
      error: new Error(
        `You've reached your monthly test limit (${access.testsUsed}/${access.limit}). Upgrade your plan for more tests.`
      ),
    }
  }

  // Create new attempt
  const { data: newAttempt, error: insertError } = await supabase
    .from('test_attempts')
    .insert({
      user_id: user.id,
      test_id: testId,
      status: 'in_progress',
    })
    .select()
    .single()

  return { data: newAttempt as TestAttempt | null, error: insertError }
}

/**
 * Get all answers for an attempt
 *
 * Used to restore state when resuming a test
 */
export async function getAttemptAnswers(attemptId: string) {
  const { data, error } = await supabase
    .from('test_attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId)

  return { data: data as TestAttemptAnswer[] | null, error }
}

/**
 * Save (or update) an answer for a question
 *
 * Uses upsert to handle both insert and update in one call
 * The unique constraint on (attempt_id, question_id) makes this work
 */
export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: OptionLetter
) {
  const { data, error } = await supabase
    .from('test_attempt_answers')
    .upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        selected_option: selectedOption,
        confirmed_at: new Date().toISOString(),
      },
      {
        onConflict: 'attempt_id,question_id',
      }
    )
    .select()
    .single()

  return { data: data as TestAttemptAnswer | null, error }
}

/**
 * Submit an attempt (finish the test)
 *
 * This will:
 * 1. Calculate the score by comparing answers to correct options
 * 2. Update the attempt with the score and mark as submitted
 * 3. Mark each answer as correct/incorrect
 */
export async function submitAttempt(attemptId: string) {
  // Get all answers for this attempt with their questions
  const { data: answers, error: answersError } = await supabase
    .from('test_attempt_answers')
    .select(`
      id,
      question_id,
      selected_option,
      test_questions!inner (
        correct_option
      )
    `)
    .eq('attempt_id', attemptId)

  if (answersError || !answers) {
    return { data: null, error: answersError }
  }

  // Calculate score
  let correct = 0
  const total = answers.length

  // Update each answer with is_correct
  for (const answer of answers) {
    const question = answer.test_questions as unknown as { correct_option: string }
    const isCorrect = answer.selected_option === question.correct_option

    if (isCorrect) correct++

    await supabase
      .from('test_attempt_answers')
      .update({ is_correct: isCorrect })
      .eq('id', answer.id)
  }

  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0

  // Update the attempt
  const { data: updatedAttempt, error: updateError } = await supabase
    .from('test_attempts')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      score_correct: correct,
      score_total: total,
      score_percent: scorePercent,
    })
    .eq('id', attemptId)
    .select()
    .single()

  return { data: updatedAttempt as TestAttempt | null, error: updateError }
}

/**
 * Get user's completed attempts for a test (for history/review)
 */
export async function getCompletedAttempts(testId: string) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  const { data, error } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('test_id', testId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })

  return { data: data as TestAttempt[] | null, error }
}
