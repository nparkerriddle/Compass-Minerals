// Server-backed storage for the Zustand persist middleware.
// All dashboard state is saved on the server (SQLite via /api/state) — NOT in
// the browser. This is the single swap point that replaces localStorage.
//
// In `npm run dev` without the Flask backend running, the fetches fail quietly
// and the app simply runs without persistence (still nothing saved locally).

const ENDPOINT = '/api/state'

export const serverStorage = {
  getItem: async () => {
    try {
      const res = await fetch(ENDPOINT, { credentials: 'include', headers: { Accept: 'application/json' } })
      if (!res.ok) return null
      const data = await res.json()
      return data?.value ?? null
    } catch {
      return null
    }
  },
  setItem: async (_name, value) => {
    try {
      await fetch(ENDPOINT, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      })
    } catch {
      // No backend (e.g. plain `vite` dev) — intentionally do not fall back to
      // localStorage. Persistence only happens when served by the Flask app.
    }
  },
  removeItem: async () => {
    try {
      await fetch(ENDPOINT, { method: 'DELETE', credentials: 'include' })
    } catch {
      // ignore
    }
  },
}
