import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { DEPARTMENTS } from '../../lib/constants'
import { DEPARTMENT_PHOTOS, DEFAULT_DEPARTMENT_PHOTO, SITE_PHOTOS } from '../../lib/departments'

function DeptCard({ name, photo, active, openings, onJump }) {
  return (
    <div className="group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="relative h-36 bg-gray-200 dark:bg-gray-700">
        <img src={photo} alt={name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <h3 className="absolute bottom-2 left-3 right-3 text-white font-semibold text-base drop-shadow">{name}</h3>
      </div>
      <div className="p-4 flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 tabular-nums">{active}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">active workers</div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-semibold tabular-nums ${openings > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{openings}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">open</div>
        </div>
        <button onClick={onJump} title="View workers"
          className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
        </button>
      </div>
    </div>
  )
}

export default function DepartmentsPage() {
  const workers = useAppStore((s) => s.workers)
  const openings = useAppStore((s) => s.openings)
  const navigate = useAppStore((s) => s.navigate)
  const [lightbox, setLightbox] = useState(null)

  const byDept = useMemo(() => {
    const active = {}, open = {}
    workers.filter((w) => w.status === 'Active').forEach((w) => { active[w.department] = (active[w.department] || 0) + 1 })
    openings.forEach((o) => { open[o.department] = (open[o.department] || 0) + (o.openingsCount || 1) })
    return { active, open }
  }, [workers, openings])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Departments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Ogden site — live headcount and open positions by area</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DEPARTMENTS.map((d) => (
          <DeptCard key={d} name={d}
            photo={DEPARTMENT_PHOTOS[d] || DEFAULT_DEPARTMENT_PHOTO}
            active={byDept.active[d] || 0}
            openings={byDept.open[d] || 0}
            onJump={() => navigate('workers')} />
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Site Photos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SITE_PHOTOS.map((p) => (
            <button key={p.src} onClick={() => setLightbox(p)}
              className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 aspect-[4/3] bg-gray-200 dark:bg-gray-700">
              <img src={p.src} alt={p.caption} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <span className="text-xs text-white">{p.caption}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <figure className="max-w-4xl max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <img src={lightbox.src} alt={lightbox.caption} className="max-h-[80vh] w-auto rounded-lg shadow-2xl" />
            <figcaption className="text-sm text-gray-200 mt-3">{lightbox.caption}</figcaption>
          </figure>
          <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 text-white/80 hover:text-white" aria-label="Close">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  )
}
