import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'

const AgentDashboard = lazy(() => import('./pages/AgentDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Login = lazy(() => import('./pages/Login'))

const LoadingShell = () => (
  <div className="min-h-screen bg-slate-50 text-slate-700 flex items-center justify-center">
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm">Loading…</div>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingShell />}>
        <Routes>
          <Route path="/" element={<Navigate to="/agent" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/agent"
            element={
              <ProtectedRoute allow={['agent', 'admin']}>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allow={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
