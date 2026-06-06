import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAppStore } from '../../store/useAppStore'

const SERIES = [
  { key: 'active', name: 'Active', color: '#00A3E0' },
  { key: 'openPositions', name: 'Open Positions', color: '#F59E0B' },
  { key: 'waitlist', name: 'Waitlist', color: '#22C55E' },
  { key: 'onFurlough', name: 'On Furlough', color: '#06B6D4' },
  { key: 'atRisk', name: 'At Risk', color: '#EF4444' },
]

export default function TrendsPage() {
  const snapshots = useAppStore((s) => s.snapshots)
  const captureSnapshot = useAppStore((s) => s.captureSnapshot)
  const deleteSnapshot = useAppStore((s) => s.deleteSnapshot)
  const darkMode = useAppStore((s) => s.darkMode)

  const axisColor = darkMode ? '#9ca3af' : '#6b7280'
  const gridColor = darkMode ? '#374151' : '#e5e7eb'
  const data = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Trends</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Headcount &amp; workforce metrics over time — capture a snapshot to build history</p>
        </div>
        <button onClick={captureSnapshot}
          className="flex items-center gap-2 px-4 py-2 bg-brand-cyan hover:bg-brand-cyan-dark text-white text-sm font-semibold rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>
          Capture Snapshot
        </button>
      </div>

      {data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No snapshots yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click <strong>Capture Snapshot</strong> (e.g. monthly) to record current numbers. Trends build as snapshots accumulate.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${gridColor}`, background: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#e5e7eb' : '#111827' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {SERIES.map((s) => <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 3 }} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-3 font-semibold">Snapshot</th>
                  {SERIES.map((s) => <th key={s.key} className="px-4 py-3 font-semibold text-right">{s.name}</th>)}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {[...data].reverse().map((snap) => (
                  <tr key={snap.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
                    <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{snap.label} <span className="text-gray-400 text-xs">({snap.date})</span></td>
                    {SERIES.map((s) => <td key={s.key} className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{snap[s.key]}</td>)}
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => deleteSnapshot(snap.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M18.16 5.79a48.108 48.108 0 00-3.478-.397" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
