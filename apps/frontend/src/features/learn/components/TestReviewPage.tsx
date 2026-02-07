import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAttemptReview } from '../api/testsApi'
import type { OptionLetter, TestAttemptAnswer, TestQuestion } from '../types'
import Dialog from './Dialog'
import QuestionCard from './QuestionCard'
import { useLeaveGuard } from './useLeaveGuard'

export default function TestReviewPage() {
  const navigate = useNavigate()
  const { attemptId } = useParams<{ attemptId: string }>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<TestAttemptAnswer[]>([])
  const [testTitle, setTestTitle] = useState<string>('Test Review')
  const [currentIndex, setCurrentIndex] = useState(0)

  const leaveGuard = useLeaveGuard(true)

  useEffect(() => {
    async function load() {
      if (!attemptId) return
      setLoading(true)
      setError(null)

      const { data, error } = await getAttemptReview(attemptId)
      if (error || !data) {
        setError(error?.message || 'Failed to load review')
        setLoading(false)
        return
      }

      setTestTitle(data.test.title)
      setQuestions(data.questions)
      setAnswers(data.answers)
      setLoading(false)
    }
    load()
  }, [attemptId])

  const selectedByQuestionId = useMemo(() => {
    const map = new Map<string, OptionLetter>()
    answers.forEach((a) => map.set(a.question_id, a.selected_option as OptionLetter))
    return map
  }, [answers])

  const currentQuestion = questions[currentIndex]
  const selected = currentQuestion ? selectedByQuestionId.get(currentQuestion.id) ?? null : null

  const handleBackToTests = () => {
    // This navigation will be intercepted by useBlocker and confirmed by the dialog.
    navigate('/app/learn')
  }

  const handleEndReview = () => {
    leaveGuard.bypassNextNavigation()
    navigate('/app/learn', { replace: true })
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

  if (error) {
    return (
      <div className="p-6">
        <div className="rl-alert rl-alert-error">
          <p>{error}</p>
          <button onClick={() => navigate('/app/learn')} className="mt-4 rl-btn rl-btn-secondary">
            Back to Learn
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={handleBackToTests}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-1"
            >
              ← Leave Review
            </button>
            <h1 className="rl-h3">{testTitle}</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Read-only review</p>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {currentQuestion ? (
          <>
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              selectedOption={selected}
              onSelectOption={() => {}}
              isLocked
            />
            <div className="mt-4 text-sm">
              {selected === (currentQuestion.correct_option as OptionLetter) ? (
                <span className="text-[var(--success)] font-medium">Correct answer</span>
              ) : (
                <span className="text-[var(--error)]">
                  Correct answer is{' '}
                  <span className="font-medium">{currentQuestion.correct_option}</span>
                </span>
              )}
            </div>
          </>
        ) : null}

        <div className="mt-6 flex items-center justify-between">
          {currentIndex === 0 ? (
            <div />
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="rl-btn rl-btn-secondary"
            >
              Back
            </button>
          )}

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleEndReview}
              className="rl-btn rl-btn-primary"
            >
              End Test
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
              className="rl-btn rl-btn-primary"
            >
              Next
            </button>
          )}
        </div>
      </div>

      <Dialog
        open={leaveGuard.open}
        title="Leave test review?"
        description="If you leave now, you'll go back to the tests list."
        actions={[
          { label: 'Cancel', onClick: leaveGuard.closeAndStay, variant: 'secondary' },
          { label: 'Confirm', onClick: leaveGuard.closeAndLeave, variant: 'danger' },
        ]}
        onClose={leaveGuard.closeAndStay}
      />
    </div>
  )
}
