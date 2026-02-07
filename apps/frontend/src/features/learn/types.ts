/**
 * Types for the Learn feature - Tests, Questions, and Attempts
 * These match the database schema in backend/supabase/migrations/
 */

// A test (e.g., "Offside Basics")
export interface Test {
  id: string
  slug: string
  title: string
  is_active: boolean
  updated_at: string
}

// A question within a test
export interface TestQuestion {
  id: string
  test_id: string
  order_index: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'A' | 'B' | 'C' | 'D'
  updated_at: string
}

// A user's attempt at a test (tracks progress and score)
export interface TestAttempt {
  id: string
  user_id: string
  test_id: string
  status: 'in_progress' | 'submitted' | 'abandoned'
  started_at: string
  submitted_at: string | null
  abandoned_at: string | null
  score_correct: number | null
  score_total: number | null
  score_percent: number | null
  updated_at: string
}

// A user's answer to a specific question within an attempt
export interface TestAttemptAnswer {
  id: string
  attempt_id: string
  question_id: string
  selected_option: 'A' | 'B' | 'C' | 'D'
  is_correct: boolean | null
  confirmed_at: string
  updated_at: string
}

// Helper type for option letters
export type OptionLetter = 'A' | 'B' | 'C' | 'D'

export interface AttemptHistoryItem {
  attempt: TestAttempt
  test: Pick<Test, 'id' | 'slug' | 'title'>
}

// A standalone practice question (outside of tests)
export interface PracticeQuestion {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
}

// A user's attempt at a practice question
export interface PracticeQuestionAttempt {
  id: string
  user_id: string
  question_id: string
  selected_option: OptionLetter
  correct_option: OptionLetter
  is_correct: boolean
  answered_at: string
  updated_at: string
}

// Tab options for the Learn page navigation
export type LearnTab = 'tests' | 'questions' | 'videos' | 'course' | 'resources'
