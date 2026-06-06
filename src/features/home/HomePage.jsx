import { useAppStore } from '../../store/useAppStore'
import { NAV_GROUPS, ICONS, sectionById } from '../../lib/nav.jsx'
import { computeAlerts } from '../../lib/alerts'

const ALERT_STYLES = {
  high: { dot: 'bg-red-500', chip: 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20' },
  medium: { dot: 'bg-amber-500', chip: 'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20' },
  info: { dot: 'bg-blue-500', chip: 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20' },
}

function StarButton({ active, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      title={active ? 'Remove bookmark' : 'Bookmark for quick access'}
      className={`p-1.5 rounded-md transition-colors ${active ? 'text-amber-400 hover:text-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-400'}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    </button>
  )
}

function SectionCard({ section, bookmarked, onNavigate, onToggle }) {
  return (
    <div
      onClick={() => onNavigate(section.id)}
      className="group relative flex items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md hover:border-brand-cyan/60 transition-all cursor-pointer"
    >
      <div className="shrink-0 rounded-lg bg-brand-cyan/10 text-brand-cyan p-2.5 group-hover:bg-brand-cyan group-hover:text-white transition-colors">
        {ICONS[section.id]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-gray-900 dark:text-gray-100">{section.label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.description}</div>
      </div>
      <div className="shrink-0 -mt-1 -mr-1">
        <StarButton active={bookmarked} onClick={() => onToggle(section.id)} />
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useAppStore((s) => s.navigate)
  const bookmarks = useAppStore((s) => s.bookmarks)
  const toggleBookmark = useAppStore((s) => s.toggleBookmark)
  const workers = useAppStore((s) => s.workers)
  const openings = useAppStore((s) => s.openings)
  const attendanceRecords = useAppStore((s) => s.attendanceRecords)
  const furloughWorkers = useAppStore((s) => s.furloughWorkers)
  const staffingPlan = useAppStore((s) => s.staffingPlan)

  const alerts = computeAlerts({ attendanceRecords, openings, furloughWorkers, staffingPlan })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const activeCount = workers.filter((w) => w.status === 'Active').length
  const openCount = openings.reduce((s, o) => s + (o.openingsCount || 1), 0)

  const pinned = bookmarks.map((id) => sectionById[id]).filter(Boolean)

  return (
    <div className="min-h-full">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src="/images/departments/salt-plant-line-1.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/95 to-brand-navy/70" />
        <div className="relative px-8 py-10 sm:py-14">
          <div className="bg-white rounded-lg px-4 py-3 inline-flex shadow-lg">
            <img src="/images/brand/compass-logo.png" alt="Compass Minerals" className="h-9 w-auto" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-white">{greeting}</h1>
          <p className="text-slate-300 mt-1">{today}</p>
          <p className="text-slate-300/90 mt-3 max-w-xl text-sm">
            Compass Minerals workforce portal — managed by YES (Your Employment Solutions).
            Jump to any section below, or bookmark the ones you use most.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={() => navigate('overview')} className="px-4 py-2 rounded-lg bg-brand-cyan hover:bg-brand-cyan-dark text-white text-sm font-semibold shadow transition-colors">
              Open Dashboard
            </button>
            <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-white/10 backdrop-blur text-white text-sm">
              <span><span className="font-bold">{activeCount}</span> active</span>
              <span className="text-white/40">·</span>
              <span><span className="font-bold">{openCount}</span> open positions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        {/* Needs attention */}
        {alerts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Needs Attention</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts.map((a) => {
                const st = ALERT_STYLES[a.severity] || ALERT_STYLES.info
                return (
                  <button key={a.id} onClick={() => navigate(a.page)}
                    className={`text-left rounded-xl border p-4 hover:shadow-md transition-all ${st.chip}`}>
                    <div className="flex items-start gap-2.5">
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${st.dot}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{a.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.detail}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Quick access (bookmarks) */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Quick Access</h2>
          </div>
          {pinned.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No bookmarks yet — tap the ☆ on any section below to pin it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pinned.map((s) => (
                <SectionCard key={s.id} section={s} bookmarked onNavigate={navigate} onToggle={toggleBookmark} />
              ))}
            </div>
          )}
        </section>

        {/* All sections by group */}
        {NAV_GROUPS.map((group) => (
          <section key={group.label}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">{group.label}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((s) => (
                <SectionCard key={s.id} section={s} bookmarked={bookmarks.includes(s.id)} onNavigate={navigate} onToggle={toggleBookmark} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
