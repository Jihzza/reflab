import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTests } from '../api/testsApi'
import type { Test } from '../types'
import TestListItem from './TestListItem'

/**
 * TestsTab - Displays the list of available tests
 *
 * Fetches tests from Supabase and displays them as clickable cards.
 * For now, clicking a test just logs to console - we'll add navigation later.
 */
export default function TestsTab() {
  const navigate = useNavigate()
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tests on component mount
  useEffect(() => {
    async function fetchTests() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await getTests()

      if (fetchError) {
        setError(fetchError.message)
      } else {
        setTests(data || [])
      }

      setLoading(false)
    }

    fetchTests()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-white/10 rounded-[var(--radius-card)]" />
          <div className="h-24 bg-white/10 rounded-[var(--radius-card)]" />
          <div className="h-24 bg-white/10 rounded-[var(--radius-card)]" />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="rl-alert rl-alert-error">
          <p>Error loading tests: {error}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (tests.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-[var(--text-muted)]">No tests available yet.</p>
        </div>
      </div>
    )
  }

  // Tests list
  return (
    <div className="p-6">
      <div className="flex items-center justify-end mb-4">
        <button
          onClick={() => navigate('/app/learn/tests/history')}
          className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline"
        >
          Test History
        </button>
      </div>
      <div className="grid gap-4">
        {tests.map((test) => (
          <TestListItem
            key={test.id}
            title={test.title}
            subtitle="Click to start test"
            onClick={() => navigate(`/app/learn/test/${test.slug}`)}
          />
        ))}
      </div>
    </div>
  )
}
