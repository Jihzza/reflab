import { useNavigate } from 'react-router-dom'
import type { TestAttempt } from '../types'

interface TestResultsProps {
  attempt: TestAttempt
  testTitle: string
}

/**
 * TestResults - Displays the score after a test is submitted
 *
 * Shows correct/total, percentage, and a button to go back.
 */
export default function TestResults({ attempt, testTitle }: TestResultsProps) {
  const navigate = useNavigate()

  const scorePercent = attempt.score_percent ?? 0
  const scoreCorrect = attempt.score_correct ?? 0
  const scoreTotal = attempt.score_total ?? 0

  // Determine result color based on score
  const getScoreColor = () => {
    if (scorePercent >= 80) return 'text-[var(--success)]'
    if (scorePercent >= 60) return 'text-[var(--warning)]'
    return 'text-[var(--error)]'
  }

  const getScoreMessage = () => {
    if (scorePercent >= 80) return 'Excellent work!'
    if (scorePercent >= 60) return 'Good effort!'
    return 'Keep practicing!'
  }

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="rl-card p-8 max-w-md w-full text-center">
        {/* Title */}
        <h1 className="rl-h3 mb-2">{testTitle}</h1>
        <p className="text-[var(--text-muted)] mb-6">Test Completed</p>

        {/* Score circle */}
        <div className="mb-6">
          <div className={`text-6xl font-bold ${getScoreColor()}`}>
            {scorePercent}%
          </div>
          <p className="text-[var(--text-secondary)] mt-2">
            {scoreCorrect} out of {scoreTotal} correct
          </p>
        </div>

        {/* Message */}
        <p className={`text-lg font-medium ${getScoreColor()} mb-8`}>
          {getScoreMessage()}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/app/learn')}
            className="rl-btn rl-btn-primary w-full"
          >
            Back to Learn
          </button>
        </div>
      </div>
    </div>
  )
}
