import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../../store/useAppStore'
import { SECTIONS, ICONS } from '../../lib/nav.jsx'

const TAG_STYLES = {
  Worker: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  Termed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  DNA: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  Waitlist: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  Furlough: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useAppStore((s) => s.navigate)
  const workers = useAppStore((s) => s.workers)
  const waitlist = useAppStore((s) => s.waitlist)
  const furlough = useAppStore((s) => s.furloughWorkers)

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return { people: [], sections: [] }
    const match = (n) => n.toLowerCase().includes(term)
    const people = []
    workers.forEach((w) => { const n = `${w.firstName} ${w.lastName}`.trim(); if (match(n)) people.push({ key: w.id, name: n, dept: w.department, tag: w.status === 'Active' ? 'Worker' : w.status, page: w.status === 'Active' ? 'workers' : 'attrition' }) })
    waitlist.forEach((w) => { const n = `${w.firstName} ${w.lastName}`.trim(); if (match(n)) people.push({ key: 'wl' + w.id, name: n, dept: w.department, tag: 'Waitlist', page: 'waitlist' }) })
    furlough.forEach((w) => { const n = `${w.firstName} ${w.lastName}`.trim(); if (match(n)) people.push({ key: 'fl' + w.id, name: n, dept: w.department, tag: 'Furlough', page: 'furlough' }) })
    const sections = SECTIONS.filter((s) => match(s.label) || match(s.description))
    return { people: people.slice(0, 25), sections: sections.slice(0, 6) }
  }, [q, workers, waitlist, furlough])

  function go(page) { navigate(page); setOpen(false); setQ('') }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 bg-brand-navy-light/40 hover:bg-brand-navy-light transition-colors">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        <span className="flex-1 text-left">Search…</span>
        <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300">⌘K</kbd>
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 px-4 border-b border-gray-200 dark:border-gray-700">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people or sections…"
                className="flex-1 py-3.5 bg-transparent text-gray-900 dark:text-gray-100 text-sm focus:outline-none" />
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {!q.trim() ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">Type a name or section…</p>
              ) : (results.people.length === 0 && results.sections.length === 0) ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">No matches.</p>
              ) : (
                <>
                  {results.people.length > 0 && (
                    <div className="px-2">
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">People</div>
                      {results.people.map((p) => (
                        <button key={p.key} onClick={() => go(p.page)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-left">
                          <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{p.name}{p.dept && <span className="text-gray-400"> · {p.dept}</span>}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TAG_STYLES[p.tag] || 'bg-gray-100 text-gray-600'}`}>{p.tag}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {results.sections.length > 0 && (
                    <div className="px-2 mt-1">
                      <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Sections</div>
                      {results.sections.map((s) => (
                        <button key={s.id} onClick={() => go(s.id)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 text-left text-brand-cyan">
                          <span className="text-gray-400">{ICONS[s.id]}</span>
                          <span className="flex-1 text-sm text-gray-900 dark:text-gray-100">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
