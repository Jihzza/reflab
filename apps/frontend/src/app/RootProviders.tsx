import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/components/AuthProvider'

export default function RootProviders() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

