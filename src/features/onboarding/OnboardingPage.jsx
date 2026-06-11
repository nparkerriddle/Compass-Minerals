import { useMemo, useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { DEPARTMENTS } from '../../lib/constants'

const STEPS = [
  { key: 'photoDone', label: 'Photo' },
  { key: 'truckSignOff', label: 'Truck Sign-off' },
  { key: 'stockpileTesting', label: 'Stockpile Test' },
  { key: 'operatorSignOff', label: 'Operator Sign-off' },
]

function Check({ on, onClick }) {
  return (
    <button onClick={onClick}
      className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${on ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-green-400'}`}>
      {on && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
    </button>
  )
}

export default function OnboardingPage() {
  const workers = useAppStore((s) => s.workers)
  const updateWorker = useAppStore((s) => s.updateWorker)
  const [deptFilter, setDeptFilter] = useState('')
  const [view, setView] = useState('inProgress') // 'inProgress' | 'onboarded'

  const pct = (w) => Math.round((STEPS.filter((s) => w[s.key]).length / STEPS.length) * 100)

  const active = useMemo(
    () => workers.filter((w) => w.status === 'Active' && (!deptFilter || w.department === deptFilter)),
    [workers, deptFilter],
  )
  const inProgress = useMemo(() => active.filter((w) => !w.onboarded), [active])
  const onboarded = useMemo(() => active.filter((w) => w.onboarded), [active])
  const rows = view === 'onboarded' ? onboarded : inProgress

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Onboarding</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Sign-off progress for active workers · {inProgress.length} in progress · {onboarded.length} onboarded</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-sm">
          <button onClick={() => setView('inProgress')}
            className={`px-3 py-1.5 font-medium transition-colors ${view === 'inProgress' ? 'bg-brand-cyan text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            In progress ({inProgress.length})
          </button>
          <button onClick={() => setView('onboarded')}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-300 dark:border-gray-600 ${view === 'onboarded' ? 'bg-brand-cyan text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            Onboarded ({onboarded.length})
          </button>
        </div>

        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-cyan">
          <option value="">All Departments</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                {STEPS.map((s) => <th key={s.key} className="px-3 py-3 font-semibold text-center">{s.label}</th>)}
                <th className="px-4 py-3 font-semibold">Progress</th>
                <th className="px-4 py-3 font-semibold">Physical Exp.</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {rows.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  {view === 'onboarded' ? 'No onboarded workers yet.' : 'No workers in progress.'}
                </td></tr>
              ) : rows.map((w) => {
                const p = pct(w)
                return (
                  <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{w.firstName} {w.lastName}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{w.department || '—'}</td>
                    {STEPS.map((s) => (
                      <td key={s.key} className="px-3 py-2.5"><div className="flex justify-center"><Check on={!!w[s.key]} onClick={() => updateWorker(w.id, { [s.key]: !w[s.key] })} /></div></td>
                    ))}
                    <td className="px-4 py-2.5 w-32">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div className={`h-full rounded-full ${p === 100 ? 'bg-green-500' : 'bg-brand-cyan'}`} style={{ width: `${p}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-gray-500 w-8 text-right">{p}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{w.physicalExpiration || '—'}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      {w.onboarded ? (
                        <button onClick={() => updateWorker(w.id, { onboarded: false })}
                          className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-cyan border border-gray-300 dark:border-gray-600 rounded-md px-2.5 py-1 transition-colors">
                          Reopen
                        </button>
                      ) : (
                        <button onClick={() => updateWorker(w.id, { onboarded: true })}
                          className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md px-2.5 py-1 transition-colors">
                          Mark onboarded
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
