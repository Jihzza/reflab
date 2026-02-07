import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyAttemptHistory } from '../api/testsApi'
import type { AttemptHistoryItem } from '../types'
import TestListItem from './TestListItem'

export default function TestHistoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<AttemptHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      const { data, error } = await getMyAttemptHistory()
      if (error) {
        setError(error.message)
      } else {
        setItems(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-full">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur px-6 py-4">
        <button
          onClick={() => navigate('/app/learn')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm mb-1"
        >
          ← Back to Learn
        </button>
        <h1 className="rl-h3">Test History</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Your submitted test attempts</p>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-white/10 rounded-[var(--radius-card)]" />
            <div className="h-24 bg-white/10 rounded-[var(--radius-card)]" />
            <div className="h-24 bg-white/10 rounded-[var(--radius-card)]" />
          </div>
        ) : error ? (
          <div className="rl-alert rl-alert-error">
            <p>Error loading history: {error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[var(--text-muted)]">No completed tests yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map(({ attempt, test }) => {
              const submittedAt = attempt.submitted_at
                ? new Date(attempt.submitted_at).toLocaleString()
                : 'Unknown date'
              const score = attempt.score_percent ?? 0

              return (
                <TestListItem
                  key={attempt.id}
                  title={test.title}
                  subtitle={`${submittedAt} • ${score}%`}
                  onClick={() =>
                    navigate(
                      `/app/learn/test/${test.slug}/attempt/${attempt.id}/review`,
                    )
                  }
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
