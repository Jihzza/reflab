import { supabase } from '@/lib/supabaseClient'
import { PLANS } from '@/config/plans'
import type { PlanName } from '@/features/billing/types'
import type {
  Test,
  TestQuestion,
  TestAttempt,
  TestAttemptAnswer,
  OptionLetter,
  AttemptHistoryItem,
} from '../types'

export async function getTests() {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('is_active', true)
    .order('title')

  return { data: data as Test[] | null, error }
}

export async function getTestBySlug(slug: string) {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('slug', slug)
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error }
  if (!data) return { data: null, error: new Error('Test not found') }
  return { data: data as Test, error: null }
}

export async function getQuestions(testId: string) {
  const { data, error } = await supabase
    .from('test_questions')
    .select('*')
    .eq('test_id', testId)
    .order('order_index')

  return { data: data as TestQuestion[] | null, error }
}

export async function getAttemptById(attemptId: string) {
  const { data, error } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('id', attemptId)
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error }
  if (!data) return { data: null, error: new Error('Attempt not found') }
  return { data: data as TestAttempt, error: null }
}

export async function getAttemptAnswers(attemptId: string) {
  const { data, error } = await supabase
    .from('test_attempt_answers')
    .select('*')
    .eq('attempt_id', attemptId)

  return { data: data as TestAttemptAnswer[] | null, error }
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOption: OptionLetter,
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
      { onConflict: 'attempt_id,question_id' },
    )
    .select()
    .single()

  return { data: data as TestAttemptAnswer | null, error }
}

export async function checkTestAccess(userId: string): Promise<{
  allowed: boolean
  testsUsed: number
  limit: number
}> {
  // Admins have unlimited attempts.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .limit(1)
    .maybeSingle()

  if (profileError) {
    console.error('[checkTestAccess] Error fetching profile role:', profileError)
  }

  if (profile?.role === 'admin') {
    return { allowed: true, testsUsed: 0, limit: Infinity }
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_name')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  const plan: PlanName = (subscription?.plan_name as PlanName) ?? 'free'
  const limit = PLANS[plan].testsPerMonth

  if (limit === Infinity) {
    return { allowed: true, testsUsed: 0, limit }
  }

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

export async function getInProgressAttempt(testId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('test_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('test_id', testId)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return { data: data as TestAttempt | null, error }
}

export async function createAttempt(testId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const access = await checkTestAccess(user.id)
  if (!access.allowed) {
    return {
      data: null,
      error: new Error(
        `You've reached your monthly test limit (${access.testsUsed}/${access.limit}). Upgrade your plan for more tests.`,
      ),
    }
  }

  const { data, error } = await supabase
    .from('test_attempts')
    .insert({
      user_id: user.id,
      test_id: testId,
      status: 'in_progress',
    })
    .select()
    .single()

  return { data: data as TestAttempt | null, error }
}

export async function abandonAttempt(attemptId: string) {
  const { data, error } = await supabase
    .from('test_attempts')
    .update({
      status: 'abandoned',
      abandoned_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .select()
    .single()

  return { data: data as TestAttempt | null, error }
}

export async function submitAttempt(attemptId: string) {
  let { data, error } = await supabase.rpc('submit_test_attempt', {
    p_attempt_id: attemptId,
  })

  // Some environments may have the RPC argument named differently.
  // If PostgREST can't find the function signature, retry with `attempt_id`.
  if (error?.code === 'PGRST202') {
    ;({ data, error } = await supabase.rpc('submit_test_attempt', {
      attempt_id: attemptId,
    }))
  }

  if (error) {
    console.error('[submitAttempt] RPC error:', error)
  }

  return { data: data as TestAttempt | null, error }
}

export async function getMyAttemptHistory() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: new Error('Not authenticated') }

  const { data, error } = await supabase
    .from('test_attempts')
    .select(`
      *,
      tests (
        id,
        slug,
        title
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })

  if (error || !data) return { data: null, error }

  const normalized: AttemptHistoryItem[] = (data as unknown as Array<{
    tests: Test | null
  } & TestAttempt>).map((row) => ({
    attempt: row as unknown as TestAttempt,
    test: row.tests as Test,
  })).filter((x) => !!x.test?.id)

  return { data: normalized, error: null }
}

export async function getAttemptReview(attemptId: string) {
  // 1) Load attempt
  const { data: attempt, error: attemptError } = await getAttemptById(attemptId)
  if (attemptError || !attempt) return { data: null, error: attemptError }

  // 2) Load test
  const { data: test, error: testError } = await supabase
    .from('tests')
    .select('*')
    .eq('id', attempt.test_id)
    .limit(1)
    .maybeSingle()
  if (testError) return { data: null, error: testError }
  if (!test) return { data: null, error: new Error('Test not found') }

  // 3) Load questions + answers
  const [{ data: questions, error: questionsError }, { data: answers, error: answersError }] =
    await Promise.all([getQuestions(test.id), getAttemptAnswers(attemptId)])

  if (questionsError || !questions) return { data: null, error: questionsError }
  if (answersError) return { data: null, error: answersError }

  return {
    data: {
      attempt,
      test: test as Test,
      questions,
      answers: answers ?? [],
    },
    error: null,
  }
}
