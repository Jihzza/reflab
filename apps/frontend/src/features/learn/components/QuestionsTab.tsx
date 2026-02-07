import { useEffect, useMemo, useState } from 'react'
import { getRandomPracticeQuestion, submitPracticeQuestionAttempt } from '../api/questionsApi'
import type { OptionLetter, PracticeQuestion, PracticeQuestionAttempt } from '../types'
import QuestionCard from './QuestionCard'

function optionText(question: PracticeQuestion, letter: OptionLetter) {
  switch (letter) {
    case 'A':
      return question.option_a
    case 'B':
      return question.option_b
    case 'C':
      return question.option_c
    case 'D':
      return question.option_d
  }
}

export default function QuestionsTab() {
  const [question, setQuestion] = useState<PracticeQuestion | null>(null)
  const [selection, setSelection] = useState<OptionLetter | null>(null)
  const [result, setResult] = useState<PracticeQuestionAttempt | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchNextQuestion = async (excludeId?: string) => {
    let { data, error } = await getRandomPracticeQuestion(excludeId)
    // If we only have 1 question in the DB, the exclude filter will return no rows.
    // In that case, allow repeating the same question.
    if ((!data || error) && excludeId) {
      ;({ data, error } = await getRandomPracticeQuestion())
    }
    if (error || !data) {
      const rich = error as { details?: string | null } | null
      setError(rich?.details || error?.message || 'Failed to load question')
      setQuestion(null)
      setLoading(false)
      return
    }

    setQuestion(data)
    setSelection(null)
    setResult(null)
    setLoading(false)
  }

  const loadNextQuestion = async (excludeId?: string) => {
    setLoading(true)
    setError(null)
    await fetchNextQuestion(excludeId)
  }

  useEffect(() => {
    let cancelled = false

    getRandomPracticeQuestion()
      .then(({ data, error }) => {
        if (cancelled) return

        if (error || !data) {
          const rich = error as { details?: string | null } | null
          setError(rich?.details || error?.message || 'Failed to load question')
          setQuestion(null)
          setLoading(false)
          return
        }

        setQuestion(data)
        setSelection(null)
        setResult(null)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError((err as Error)?.message || 'Failed to load question')
        setQuestion(null)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const correctOption = result?.correct_option ?? null
  const isCorrect = result?.is_correct ?? null

  const feedback = useMemo(() => {
    if (!question || !result || !correctOption) return null

    if (isCorrect) {
      return { kind: 'correct' as const, text: 'Correct answer' }
    }

    return {
      kind: 'wrong' as const,
      text: `Correct answer is ${correctOption}. ${optionText(question, correctOption)}`,
    }
  }, [question, result, correctOption, isCorrect])

  const handleConfirmOrNext = async () => {
    if (!question) return

    if (result) {
      await loadNextQuestion(question.id)
      return
    }

    if (!selection) return
    setSubmitting(true)
    setError(null)

    const { data, error } = await submitPracticeQuestionAttempt(question.id, selection)
    if (error || !data) {
      const rich = error as { details?: string | null } | null
      setError(rich?.details || error?.message || 'Failed to submit answer')
      setSubmitting(false)
      return
    }

    setResult(data)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-64 bg-white/10 rounded-[var(--radius-card)]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rl-alert rl-alert-error max-w-2xl mx-auto">
          <p>{error}</p>
          <button
            onClick={() => loadNextQuestion()}
            className="mt-4 rl-btn rl-btn-secondary"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="p-6">
        <div className="text-center py-12 max-w-2xl mx-auto">
          <h2 className="rl-h3">Questions</h2>
          <p className="mt-2 text-[var(--text-secondary)]">No practice questions available yet.</p>
        </div>
      </div>
    )
  }

  const locked = !!result
  const buttonLabel = locked ? 'Next Question' : 'Confirm'

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <h2 className="rl-h3">Questions</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Practice one question at a time</p>
        </div>

        <QuestionCard
          question={question}
          selectedOption={selection}
          onSelectOption={(opt) => setSelection(opt)}
          isLocked={locked}
        />

        {feedback ? (
          <div
            className={[
              'mt-4 rl-alert text-sm',
              feedback.kind === 'correct'
                ? 'rl-alert-success'
                : 'rl-alert-error',
            ].join(' ')}
          >
            <p className="font-medium">{feedback.text}</p>
            {feedback.kind === 'wrong' && selection ? (
              <p className="mt-1">
                You chose {selection}. {optionText(question, selection)}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end">
          <button
            onClick={handleConfirmOrNext}
            disabled={submitting || (!locked && !selection)}
            className="rl-btn rl-btn-primary"
          >
            {submitting ? 'Submitting...' : buttonLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
