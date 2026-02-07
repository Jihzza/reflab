import { supabase } from '@/lib/supabaseClient'
import type { OptionLetter, PracticeQuestion, PracticeQuestionAttempt } from '../types'

export async function getRandomPracticeQuestion(excludeId?: string) {
  const { data, error } = await supabase.rpc('get_random_practice_question', {
    p_exclude_id: excludeId ?? null,
  })

  if (error) return { data: null, error }

  const row = (data as PracticeQuestion[] | null)?.[0] ?? null
  if (!row) return { data: null, error: new Error('No practice questions available') }

  return { data: row, error: null }
}

export async function submitPracticeQuestionAttempt(
  questionId: string,
  selectedOption: OptionLetter,
) {
  const { data, error } = await supabase.rpc('submit_practice_question_attempt', {
    p_question_id: questionId,
    p_selected_option: selectedOption,
  })

  if (error) {
    console.error('[submitPracticeQuestionAttempt] RPC error:', error)
  }

  return { data: data as PracticeQuestionAttempt | null, error }
}

