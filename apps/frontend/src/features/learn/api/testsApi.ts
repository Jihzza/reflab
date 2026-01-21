import { supabase } from '@/lib/supabaseClient'
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
 * Get or create an attempt for a test
 *
 * Logic:
 * 1. Check if user has an existing "in_progress" attempt for this test
 * 2. If yes, return it (allows resuming)
 * 3. If no, create a new attempt
 *
 * This ensures users can pause and resume tests
 */
export async function getOrCreateAttempt(testId: string) {
  // First, get the current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: new Error('Not authenticated') }
  }

  // Check for existing in-progress attempt
  const { data: existingAttempt, error: fetchError } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('test_id', testId)
    .eq('status', 'in_progress')
    .single()

  // If found, return it
  if (existingAttempt) {
    return { data: existingAttempt as TestAttempt, error: null }
  }

  // If not found (PGRST116 = no rows), create a new one
  if (fetchError && fetchError.code !== 'PGRST116') {
    return { data: null, error: fetchError }
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
