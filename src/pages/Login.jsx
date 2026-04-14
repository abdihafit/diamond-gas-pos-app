import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail } from '../firebase/auth'
import { upsertUser } from '../firebase/db'

const defaultCreds = {
  email: '',
  password: '',
}

const humanizeAuthError = (err) => {
  if (!err?.code) return 'Unable to sign in right now. Please try again.'
  if (err.code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
    return 'Invalid email or password.'
  }
  return err.message
}

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultCreds)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) {
      setError('Email and password are required.')
      return
    }

    setError('')
    setStatus('loading')

    try {
      const email = form.email.trim().toLowerCase()
      const userCredential = await signInWithEmail(email, form.password)
      const user = userCredential.user

      const role = email === 'admin@diamondgas.com' ? 'admin' : 'agent'

      await upsertUser(user.uid, {
        name: email.split('@')[0],
        email,
        role,
      })

      navigate(role === 'admin' ? '/admin' : '/agent')
    } catch (err) {
      setError(humanizeAuthError(err))
      setStatus('idle')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900">
              <img
                src="/diamond-gas-logo.png"
                alt="Diamond Gas"
                className="h-10 w-auto"
              />
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-slate-800">Diamond Gas Limited</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={form.email}
                onChange={updateField('email')}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={form.password}
                onChange={updateField('password')}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {status === 'loading' ? 'Signing in…' : 'Sign In'}
            </button>

            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  )
}
