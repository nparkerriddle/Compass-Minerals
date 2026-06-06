import { useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { effectivePoints, attendanceStatus } from '../../lib/attendance'

export default function SupervisorsPage() {
  const workers = useAppStore((s) => s.workers)
  const attendanceRecords = useAppStore((s) => s.attendanceRecords)
  const incidents = useAppStore((s) => s.incidents)

  const rows = useMemo(() => {
    const map = {}
    const ensure = (name) => (map[name] ||= { supervisor: name, headcount: 0, ptsSum: 0, ptsCount: 0, atRisk: 0, incidents: 0 })

    workers.filter((w) => w.status === 'Active').forEach((w) => {
      const sup = (w.supervisor || '').trim() || 'Unassigned'
      ensure(sup).headcount++
    })
    attendanceRecords.forEach((r) => {
      const sup = (r.supervisor || '').trim() || 'Unassigned'
      const m = ensure(sup)
      m.ptsSum += effectivePoints(r); m.ptsCount++
      if (attendanceStatus(r).tier >= 3) m.atRisk++
    })
    incidents.forEach((i) => {
      const sup = (i.supervisor || '').trim() || 'Unassigned'
      ensure(sup).incidents++
    })

    return Object.values(map)
      .map((m) => ({ ...m, avgPts: m.ptsCount ? (m.ptsSum / m.ptsCount).toFixed(1) : '—' }))
      .sort((a, b) => b.headcount - a.headcount)
  }, [workers, attendanceRecords, incidents])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Supervisors</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Headcount, attendance, and incidents rolled up by supervisor</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-semibold">Supervisor</th>
                <th className="px-4 py-3 font-semibold text-right">Active Headcount</th>
                <th className="px-4 py-3 font-semibold text-right">Avg Attendance Pts</th>
                <th className="px-4 py-3 font-semibold text-right">At Risk (7+)</th>
                <th className="px-4 py-3 font-semibold text-right">Incidents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No supervisor data yet.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.supervisor} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{r.supervisor}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{r.headcount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{r.avgPts}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${r.atRisk > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>{r.atRisk}</td>
                  <td className={`px-4 py-2.5 text-right tabular-nums ${r.incidents > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>{r.incidents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
