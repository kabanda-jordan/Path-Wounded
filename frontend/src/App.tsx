import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { useAuthStore } from './context/AuthContext'
import { useSessionBootstrap } from './hooks/useSessionBootstrap'
import Layout from './components/layout/Layout'

import LandingPage from './pages/landing/LandingPage'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'

import Overview from './pages/dashboard/Overview'
import Orders from './pages/dashboard/Orders'
import Carriers from './pages/dashboard/Carriers'
import Invoices from './pages/dashboard/Invoices'
import Automations from './pages/dashboard/Automations'
import Analytics from './pages/dashboard/Analytics'
import Reporting from './pages/dashboard/Reporting'
import Messages from './pages/dashboard/Messages'
import Settings from './pages/dashboard/Settings'
import Help from './pages/dashboard/Help'

function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/dashboard/overview" replace />
  return <Outlet />
}

export default function App() {
  useSessionBootstrap()

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Layout><Outlet /></Layout>}>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="orders" element={<Orders />} />
              <Route path="carriers" element={<Carriers />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="automations" element={<Automations />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reporting" element={<Reporting />} />
              <Route path="messages" element={<Messages />} />
              <Route path="settings" element={<Settings />} />
              <Route path="help" element={<Help />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)', color: '#F9FAFB' } }} />
    </QueryClientProvider>
  )
}
