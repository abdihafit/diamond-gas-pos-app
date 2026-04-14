import { Navigate } from 'react-router-dom'
import { useAuthRole } from './useAuthRole'

const Shell = ({ children }) => (
  <div className="min-h-screen bg-slate-50 text-slate-700 flex items-center justify-center px-6">
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-6 py-5 text-sm shadow-sm">
      {children}
    </div>
  </div>
)

export default function ProtectedRoute({ allow, children }) {
  const { user, role, loading, error } = useAuthRole()

  if (loading) {
    return (
      <Shell>
        <div className="font-semibold text-slate-800">Loading…</div>
        <p className="mt-2 text-slate-500">Checking your access.</p>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="font-semibold text-rose-700">Auth error</div>
        <p className="mt-2 text-rose-600">{error}</p>
      </Shell>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(role)) {
    return (
      <Shell>
        <div className="font-semibold text-slate-800">Access restricted</div>
        <p className="mt-2 text-slate-500">
          Your account does not have permission to view this area.
        </p>
      </Shell>
    )
  }

  return children
}
