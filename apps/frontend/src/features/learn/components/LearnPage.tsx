import { useState } from 'react'
import type { LearnTab } from '../types'
import LearnTabs from './LearnTabs'
import TestsTab from './TestsTab'
import QuestionsTab from './QuestionsTab'
import VideosTab from './VideosTab'
import CourseTab from './CourseTab'
import ResourcesTab from './ResourcesTab'

/**
 * LearnPage - Main container for the Learn feature
 *
 * Manages tab state and renders the appropriate tab content.
 * Default tab is "tests".
 */
export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<LearnTab>('tests')

  // Render the content for the active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'tests':
        return <TestsTab />
      case 'questions':
        return <QuestionsTab />
      case 'videos':
        return <VideosTab />
      case 'course':
        return <CourseTab />
      case 'resources':
        return <ResourcesTab />
      default:
        return <TestsTab />
    }
  }

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Learn</h1>
        <p className="mt-1 text-gray-500">Study materials and practice tests</p>
      </div>

      {/* Tab navigation */}
      <LearnTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      {renderTabContent()}
    </div>
  )
}
