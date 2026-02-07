import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  abandonAttempt,
  createAttempt,
  getAttemptAnswers,
  getInProgressAttempt,
  getQuestions,
  getTestBySlug,
  saveAnswer,
  submitAttempt,
} from '../api/testsApi'
import type { OptionLetter, Test, TestAttempt, TestAttemptAnswer, TestQuestion } from '../types'
import Dialog from './Dialog'
import QuestionCard from './QuestionCard'
import { useLeaveGuard } from './useLeaveGuard'

export default function TestPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [test, setTest] = useState<Test | null>(null)
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [attempt, setAttempt] = useState<TestAttempt | null>(null)

  const [confirmedAnswers, setConfirmedAnswers] = useState<Map<string, OptionLetter>>(new Map())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pendingSelection, setPendingSelection] = useState<OptionLetter | null>(null)

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [resumeDialogOpen, setResumeDialogOpen] = useState(false)
  const [resumeAttempt, setResumeAttempt] = useState<TestAttempt | null>(null)

  const leaveGuard = useLeaveGuard(true)

  const restartRequested = searchParams.get('restart') === '1'

  const currentQuestion = questions[currentIndex] ?? null
  const isLastQuestion = currentIndex === questions.length - 1

  const answeredCount = confirmedAnswers.size

  const confirmedSelection = useMemo(() => {
    if (!currentQuestion) return null
    return confirmedAnswers.get(currentQuestion.id) ?? null
  }, [currentQuestion, confirmedAnswers])

  const effectiveSelection = pendingSelection ?? confirmedSelection

  useEffect(() => {
    async function load() {
      if (!slug) {
        setError('No test specified')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data: testData, error: testError } = await getTestBySlug(slug)
      if (testError || !testData) {
        setError(testError?.message || 'Test not found')
        setLoading(false)
        return
      }
      setTest(testData)

      const { data: questionsData, error: questionsError } = await getQuestions(testData.id)
      if (questionsError || !questionsData) {
        setError(questionsError?.message || 'Failed to load questions')
        setLoading(false)
        return
      }
      setQuestions(questionsData)

      // Check for an existing attempt first so we can prompt Resume/Restart/Cancel.
      const { data: inProgress, error: inProgressError } = await getInProgressAttempt(testData.id)
      if (inProgressError) {
        setError(inProgressError.message)
        setLoading(false)
        return
      }

      if (restartRequested) {
        if (inProgress?.id) await abandonAttempt(inProgress.id)
        const { data: newAttempt, error: createError } = await createAttempt(testData.id)
        if (createError || !newAttempt) {
          setError(createError?.message || 'Failed to start test')
          setLoading(false)
          return
        }
        setAttempt(newAttempt)
        setConfirmedAnswers(new Map())
        setCurrentIndex(0)
        setLoading(false)
        return
      }

      if (inProgress) {
        setResumeAttempt(inProgress)
        setResumeDialogOpen(true)
        setLoading(false)
        return
      }

      const { data: newAttempt, error: createError } = await createAttempt(testData.id)
      if (createError || !newAttempt) {
        setError(createError?.message || 'Failed to start test')
        setLoading(false)
        return
      }
      setAttempt(newAttempt)
      setLoading(false)
    }

    load()
  }, [slug, restartRequested])

  const loadAnswersForAttempt = async (attemptId: string, qs: TestQuestion[]) => {
    const { data: existingAnswers, error } = await getAttemptAnswers(attemptId)
    if (error) {
      setError(error.message)
      return
    }

    const map = new Map<string, OptionLetter>()
    ;(existingAnswers ?? []).forEach((a: TestAttemptAnswer) => {
      map.set(a.question_id, a.selected_option as OptionLetter)
    })
    setConfirmedAnswers(map)

    // Move to first unanswered question, if any.
    const firstUnansweredIndex = qs.findIndex((q) => !map.has(q.id))
    setCurrentIndex(firstUnansweredIndex === -1 ? 0 : firstUnansweredIndex)
  }

  const handleResume = async () => {
    if (!resumeAttempt) return
    setAttempt(resumeAttempt)
    await loadAnswersForAttempt(resumeAttempt.id, questions)
    setResumeDialogOpen(false)
    setResumeAttempt(null)
  }

  const handleRestart = async () => {
    if (!test) return
    if (resumeAttempt?.id) {
      await abandonAttempt(resumeAttempt.id)
    }

    const { data: newAttempt, error } = await createAttempt(test.id)
    if (error || !newAttempt) {
      setError(error?.message || 'Failed to restart test')
      return
    }

    setAttempt(newAttempt)
    setConfirmedAnswers(new Map())
    setCurrentIndex(0)
    setResumeDialogOpen(false)
    setResumeAttempt(null)
  }

  const handleCancelResumePrompt = () => {
    setResumeDialogOpen(false)
    setResumeAttempt(null)
    leaveGuard.bypassNextNavigation()
    navigate('/app/learn', { replace: true })
  }

  const handleSelect = (option: OptionLetter) => {
    setPendingSelection(option)
  }

  const handleBack = () => {
    setPendingSelection(null)
    setCurrentIndex((i) => Math.max(0, i - 1))
  }

  const handleConfirm = async () => {
    if (!attempt || !currentQuestion || !effectiveSelection) return

    setSaving(true)
    setError(null)

    // Only hit the DB if the choice changed or isn't saved yet.
    if (effectiveSelection !== confirmedSelection) {
      const { error } = await saveAnswer(attempt.id, currentQuestion.id, effectiveSelection)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }

      setConfirmedAnswers((prev) => {
        const next = new Map(prev)
        next.set(currentQuestion.id, effectiveSelection)
        return next
      })
    }

    setSaving(false)
    setPendingSelection(null)

    if (isLastQuestion) {
      await handleEndTest()
    } else {
      setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
    }
  }

  const handleEndTest = async () => {
    if (!attempt || !slug) return

    setSubmitting(true)
    setError(null)

    const { data: updatedAttempt, error } = await submitAttempt(attempt.id)
    if (error || !updatedAttempt) {
      const rich = error as { details?: string | null; hint?: string | null } | null
      setError(rich?.details || error?.message || 'Failed to submit test')
      setSubmitting(false)
      return
    }

    setSubmitting(false)
    leaveGuard.bypassNextNavigation()
    navigate(`/app/learn/test/${slug}/attempt/${updatedAttempt.id}/results`)
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

  if (!test || questions.length === 0 || (!attempt && !resumeAttempt)) {
    return (
      <div className="p-6">
        <p className="text-[var(--text-secondary)]">Test unavailable.</p>
        <button onClick={() => navigate('/app/learn')} className="mt-4 rl-btn rl-btn-secondary">
          Back to Learn
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/app/learn')}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-1"
            >
              ← Leave Test
            </button>
            <h1 className="rl-h3">{test.title}</h1>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            {answeredCount} / {questions.length} answered
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            selectedOption={effectiveSelection}
            onSelectOption={handleSelect}
          />
        ) : null}

        <div className="mt-6 flex items-center justify-between">
          {currentIndex === 0 ? (
            <div />
          ) : (
            <button
              onClick={handleBack}
              className="rl-btn rl-btn-secondary"
            >
              Back
            </button>
          )}

          <button
            onClick={handleConfirm}
            disabled={!effectiveSelection || saving || submitting}
            className="rl-btn rl-btn-primary"
          >
            {submitting ? 'Submitting...' : saving ? 'Saving...' : isLastQuestion ? 'End Test' : 'Confirm'}
          </button>
        </div>
      </div>

      <Dialog
        open={resumeDialogOpen}
        title="Resume test?"
        description="You have an in-progress attempt for this test."
        actions={[
          { label: 'Cancel', onClick: handleCancelResumePrompt, variant: 'secondary' },
          { label: 'Restart', onClick: handleRestart, variant: 'danger' },
          { label: 'Resume', onClick: handleResume, variant: 'primary' },
        ]}
        onClose={() => {}}
      />

      <Dialog
        open={leaveGuard.open}
        title="Leave the test?"
        description="Your progress is saved. You can resume later."
        actions={[
          { label: 'Cancel', onClick: leaveGuard.closeAndStay, variant: 'secondary' },
          { label: 'Confirm', onClick: leaveGuard.closeAndLeave, variant: 'danger' },
        ]}
        onClose={leaveGuard.closeAndStay}
      />
    </div>
  )
}
