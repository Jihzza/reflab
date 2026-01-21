import { useEffect, useState } from 'react'
import { getTests } from '../api/testsApi'
import type { Test } from '../types'

/**
 * TestsTab - Displays the list of available tests
 *
 * Fetches tests from Supabase and displays them as clickable cards.
 * For now, clicking a test just logs to console - we'll add navigation later.
 */
export default function TestsTab() {
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
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading tests: {error}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (tests.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No tests available yet.</p>
        </div>
      </div>
    )
  }

  // Tests list
  return (
    <div className="p-6">
      <div className="grid gap-4">
        {tests.map((test) => (
          <button
            key={test.id}
            onClick={() => {
              // TODO: Navigate to test page
              console.log('Selected test:', test.slug)
            }}
            className="w-full text-left bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <h3 className="text-lg font-semibold text-gray-900">{test.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Slug: {test.slug}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
