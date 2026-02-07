import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAttemptReview } from '../api/testsApi'
import type { OptionLetter, TestQuestion, TestAttemptAnswer } from '../types'
import Dialog from './Dialog'

function optionText(question: TestQuestion, letter: OptionLetter) {
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

export default function TestResultsPage() {
  const navigate = useNavigate()
  const { slug, attemptId } = useParams<{ slug: string; attemptId: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redoDialogOpen, setRedoDialogOpen] = useState(false)

  const [data, setData] = useState<{
    testTitle: string
    questions: TestQuestion[]
    answers: TestAttemptAnswer[]
    scoreCorrect: number
    scoreTotal: number
    scorePercent: number
  } | null>(null)

  useEffect(() => {
    async function load() {
      if (!attemptId) return
      setLoading(true)
      setError(null)

      const { data, error } = await getAttemptReview(attemptId)
      if (error || !data) {
        setError(error?.message || 'Failed to load results')
        setLoading(false)
        return
      }

      setData({
        testTitle: data.test.title,
        questions: data.questions,
        answers: data.answers,
        scoreCorrect: data.attempt.score_correct ?? 0,
        scoreTotal: data.attempt.score_total ?? data.questions.length,
        scorePercent: data.attempt.score_percent ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [attemptId])

  const answerByQuestionId = useMemo(() => {
    const map = new Map<string, TestAttemptAnswer>()
    data?.answers.forEach((a) => map.set(a.question_id, a))
    return map
  }, [data])

  const handleRedoConfirm = async () => {
    if (!slug) return
    setRedoDialogOpen(false)
    navigate(`/app/learn/test/${slug}?restart=1`)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-64 bg-white/10 rounded-[var(--radius-card)]" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rl-alert rl-alert-error">
          <p>{error ?? 'Failed to load results'}</p>
          <button
            onClick={() => navigate('/app/learn')}
            className="mt-4 rl-btn rl-btn-secondary"
          >
            Back to Learn
          </button>
        </div>
      </div>
    )
  }

  const scorePercent = data.scorePercent
  const scoreCorrect = data.scoreCorrect
  const scoreTotal = data.scoreTotal

  const scoreColor =
    scorePercent >= 80 ? 'text-[var(--success)]' : scorePercent >= 60 ? 'text-[var(--warning)]' : 'text-[var(--error)]'

  return (
    <div className="min-h-full">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur px-6 py-4">
        <button
          onClick={() => navigate('/app/learn')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-1"
        >
          ← Back to Learn
        </button>
        <h1 className="rl-h3">{data.testTitle}</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Test Completed</p>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="rl-card p-6 text-center">
          <div className={`text-6xl font-bold ${scoreColor}`}>{scorePercent}%</div>
          <p className="text-[var(--text-secondary)] mt-2">
            {scoreCorrect} out of {scoreTotal} correct
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/app/learn')}
              className="rl-btn rl-btn-secondary"
            >
              Go Back to Tests List
            </button>
            <button
              onClick={() =>
                attemptId && slug
                  ? navigate(`/app/learn/test/${slug}/attempt/${attemptId}/review`)
                  : null
              }
              disabled={!attemptId || !slug}
              className="rl-btn rl-btn-primary"
            >
              Open Review Page
            </button>
            <button
              onClick={() => setRedoDialogOpen(true)}
              className="rl-btn rl-btn-secondary"
            >
              Re-Do the Test
            </button>
          </div>
        </div>

        <div className="rl-card p-6">
          <h2 className="rl-h3">Review</h2>
          <div className="mt-4 space-y-4">
            {data.questions.map((q, idx) => {
              const a = answerByQuestionId.get(q.id)
              const selected = (a?.selected_option as OptionLetter | undefined) ?? null
              const isCorrect = a?.is_correct ?? null

              return (
                <div key={q.id} className="border border-[var(--border-subtle)] rounded-[var(--radius-input)] p-4 bg-[var(--bg-surface-2)]">
                  <p className="text-sm text-[var(--text-muted)] mb-1">Question {idx + 1}</p>
                  <p className="text-[var(--text-primary)] font-medium">{q.question_text}</p>
                  <div className="mt-2 text-sm">
                    {isCorrect === true ? (
                      <span className="text-[var(--success)] font-medium">Correct answer</span>
                    ) : isCorrect === false ? (
                      <span className="text-[var(--error)]">
                        Correct answer is{' '}
                        <span className="font-medium">
                          {q.correct_option}. {optionText(q, q.correct_option as OptionLetter)}
                        </span>
                        {selected ? (
                          <>
                            {' '}
                            (You chose {selected}. {optionText(q, selected)})
                          </>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-[var(--text-secondary)]">No answer recorded</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Dialog
        open={redoDialogOpen}
        title="Re-do this test?"
        description="This will start the test again from the first question."
        actions={[
          { label: 'Cancel', onClick: () => setRedoDialogOpen(false), variant: 'secondary' },
          { label: 'Confirm', onClick: handleRedoConfirm, variant: 'primary' },
        ]}
        onClose={() => setRedoDialogOpen(false)}
      />
    </div>
  )
}
