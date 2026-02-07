import { createBrowserRouter, createRoutesFromElements, Navigate, Route } from 'react-router-dom'
import LandingPage from '@/features/landing/components/LandingPage'
import ResetPassword from '@/features/auth/components/ResetPassword'
import OAuthCallbackPage from '@/features/auth/components/OAuthCallbackPage'
import DashboardPage from '@/features/dashboard/components/DashboardPage'
import LearnPage from '@/features/learn/components/LearnPage'
import TestPage from '@/features/learn/components/TestPage'
import TestHistoryPage from '@/features/learn/components/TestHistoryPage'
import TestResultsPage from '@/features/learn/components/TestResultsPage'
import TestReviewPage from '@/features/learn/components/TestReviewPage'
import NotificationsPage from '@/features/notifications/components/NotificationsPage'
import SettingsPage from '@/features/settings/components/SettingsPage'
import RequireAuth from './RequireAuth'
import AppShell from './AppShell'
import RootProviders from './RootProviders'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootProviders />}>
      <Route index element={<LandingPage />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="auth/callback" element={<OAuthCallbackPage />} />

      <Route
        path="app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tests" element={<Navigate to="/app/learn" replace />} />
        <Route path="learn" element={<LearnPage />} />
        <Route path="learn/tests/history" element={<TestHistoryPage />} />
        <Route path="learn/test/:slug" element={<TestPage />} />
        <Route path="learn/test/:slug/attempt/:attemptId/results" element={<TestResultsPage />} />
        <Route path="learn/test/:slug/attempt/:attemptId/review" element={<TestReviewPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Route>,
  ),
)

