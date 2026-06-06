import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'

// Wraps the app. Data only loads from the server once authenticated.
export default function LoginGate({ children }) {
  const [status, setStatus] = useState('checking') // checking | out | in
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function enter() {
    // Pull server state now that we're authenticated.
    try { await useAppStore.persist.rehydrate() } catch { /* dev w/o backend */ }
    setStatus('in')
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/session', { credentials: 'include' })
        const data = await res.json()
        if (data.authenticated) await enter()
        else setStatus('out')
      } catch {
        // No backend reachable (plain `vite` dev) — let the app through so
        // local development still works without running Flask.
        await enter()
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) await enter()
      else setError('Incorrect password. Please try again.')
    } catch {
      setError('Could not reach the server.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-navy text-slate-300 text-sm">
        Loading…
      </div>
    )
  }

  if (status === 'in') return children

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-navy px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl px-5 py-4 mb-6 flex items-center justify-center shadow-lg">
          <img src="/images/brand/compass-logo.png" alt="Compass Minerals" className="h-9 w-auto" />
        </div>
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Workforce Portal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 mb-5">Enter the password to continue.</p>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan"
            placeholder="••••••••"
          />
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !password}
            className="mt-5 w-full py-2.5 rounded-lg bg-brand-cyan hover:bg-brand-cyan-dark text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 text-center">YES (Your Employment Solutions)</p>
        </form>
      </div>
    </div>
  )
}
