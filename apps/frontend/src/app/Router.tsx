import { Routes, Route } from "react-router-dom";
import LandingPage from "@/features/landing/components/LandingPage";
import ResetPassword from "@/features/auth/components/ResetPassword";
import DashboardPage from "@/features/dashboard/components/DashboardPage";
import TestsList from "@/features/tests/components/TestsList";
import LearnPage from "@/features/learn/components/LearnPage";
import TestPage from "@/features/learn/components/TestPage";
import NotificationsPage from "@/features/notifications/components/NotificationsPage";
import RequireAuth from "./RequireAuth";
import AppShell from "./AppShell";

export default function Router() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes - wrapped in auth check and app layout */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        {/* /app shows dashboard by default */}
        <Route index element={<DashboardPage />} />
        {/* /app/dashboard also shows dashboard */}
        <Route path="dashboard" element={<DashboardPage />} />
        {/* /app/tests shows tests list */}
        <Route path="tests" element={<TestsList />} />
        {/* /app/learn shows the learn page with tabs */}
        <Route path="learn" element={<LearnPage />} />
        {/* /app/learn/test/:slug shows the test-taking page */}
        <Route path="learn/test/:slug" element={<TestPage />} />
        {/* /app/notifications shows user notifications */}
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}
