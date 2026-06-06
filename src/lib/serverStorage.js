// Server-backed storage for the Zustand persist middleware.
// All dashboard state is saved on the server (SQLite via /api/state) — NOT in
// the browser. Writes are debounced, and save status is published so the UI can
// show a "Saving… / Saved" indicator.
//
// In `npm run dev` without the Flask backend running, the fetches fail quietly
// and the app simply runs without persistence (still nothing saved locally).

const ENDPOINT = '/api/state'
const DEBOUNCE_MS = 600

// ── Save-status pub/sub ───────────────────────────────────────────────────────
let status = { state: 'idle', at: null } // idle | saving | saved | error | conflict
let rev = 0 // last revision seen from the server (optimistic concurrency)
const listeners = new Set()
export const saveStatus = {
  get: () => status,
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn) },
}
function setStatus(state) {
  status = { state, at: Date.now() }
  listeners.forEach((fn) => fn(status))
}

// ── Debounced writer ──────────────────────────────────────────────────────────
let timer = null
let pending = null
async function flush() {
  timer = null
  const value = pending
  pending = null
  setStatus('saving')
  try {
    const res = await fetch(ENDPOINT, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value, rev }),
    })
    if (res.status === 409) {
      // Someone else saved since we loaded — don't clobber their changes.
      setStatus('conflict')
      return
    }
    if (res.ok) {
      const data = await res.json().catch(() => null)
      if (data && typeof data.rev === 'number') rev = data.rev
      setStatus('saved')
    } else {
      setStatus('error')
    }
  } catch {
    // No backend (e.g. plain `vite` dev) — intentionally no localStorage fallback.
    setStatus('idle')
  }
}

export const serverStorage = {
  getItem: async () => {
    try {
      const res = await fetch(ENDPOINT, { credentials: 'include', headers: { Accept: 'application/json' } })
      if (!res.ok) return null
      const data = await res.json()
      if (typeof data?.rev === 'number') rev = data.rev
      return data?.value ?? null
    } catch {
      return null
    }
  },
  setItem: async (_name, value) => {
    pending = value
    if (timer) clearTimeout(timer)
    timer = setTimeout(flush, DEBOUNCE_MS)
  },
  removeItem: async () => {
    try {
      await fetch(ENDPOINT, { method: 'DELETE', credentials: 'include' })
    } catch {
      // ignore
    }
  },
}
