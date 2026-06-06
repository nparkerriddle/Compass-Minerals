import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useAppStore } from '../../store/useAppStore'

const COLORS = ['#ef4444','#f97316','#eab308','#84cc16','#22c55e','#06b6d4','#3b82f6','#8b5cf6','#ec4899']

function ChartCard({ title, sub, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  )
}

export default function AttritionPage() {
  const workers = useAppStore((s) => s.workers)
  const darkMode = useAppStore((s) => s.darkMode)

  // Theme-aware chart colors (Recharts can't read Tailwind dark: classes)
  const axisColor = darkMode ? '#9ca3af' : '#6b7280'
  const gridColor = darkMode ? '#374151' : '#e5e7eb'
  const tooltipStyle = {
    fontSize: 12,
    borderRadius: 8,
    border: `1px solid ${gridColor}`,
    background: darkMode ? '#1f2937' : '#ffffff',
    color: darkMode ? '#e5e7eb' : '#111827',
  }

  const termed = useMemo(() => workers.filter((w) => w.status === 'Termed'), [workers])
  const dna    = useMemo(() => workers.filter((w) => w.status === 'DNA'), [workers])

  const deptAttrition = useMemo(() => {
    const map = {}
    ;[...termed, ...dna].forEach((w) => {
      map[w.department || 'Unknown'] = (map[w.department || 'Unknown'] || 0) + 1
    })
    return Object.entries(map).map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count)
  }, [termed, dna])

  const termReasons = useMemo(() => {
    const map = {}
    termed.forEach((w) => {
      if (w.termReason) map[w.termReason] = (map[w.termReason] || 0) + 1
    })
    return Object.entries(map).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
  }, [termed])

  const voluntaryCount = termed.filter((w) =>
    w.termReason?.startsWith('Q') || w.termReason === 'TH Hired'
  ).length
  const involuntaryCount = termed.filter((w) => w.termReason?.startsWith('LG')).length

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Attrition</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Termination analytics — computed live from worker records</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Termed', value: termed.length, color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', val: 'text-red-700 dark:text-red-400' },
          { label: 'DNA', value: dna.length, color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800', val: 'text-purple-700 dark:text-purple-400' },
          { label: 'Voluntary', value: voluntaryCount, color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', val: 'text-amber-700 dark:text-amber-400' },
          { label: 'Involuntary (LG)', value: involuntaryCount, color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', val: 'text-orange-700 dark:text-orange-400' },
        ].map((k) => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.color}`}>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.val}`}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Separations by Department" sub="Termed + DNA combined">
          {deptAttrition.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No attrition data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deptAttrition} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 11, fill: axisColor }} />
                <Tooltip formatter={(v) => [v, 'Separations']} contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Termination Reasons" sub="Termed workers only">
          {termReasons.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No term reasons recorded yet.<br /><span className="text-xs">Add term reasons when editing terminated workers.</span></p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={termReasons.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis type="category" dataKey="reason" width={160} tick={{ fontSize: 11, fill: axisColor }} />
                <Tooltip formatter={(v) => [v, 'Workers']} contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {termReasons.slice(0, 10).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Reason code legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Term Reason Code Key</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div><span className="font-medium text-gray-800 dark:text-gray-200">LG</span> = Let go (involuntary)</div>
          <div><span className="font-medium text-gray-800 dark:text-gray-200">Q</span> = Quit (voluntary)</div>
          <div><span className="font-medium text-gray-800 dark:text-gray-200">TH</span> = Transferred / hired perm</div>
          <div><span className="font-medium">LG Attendance</span> — attendance policy</div>
          <div><span className="font-medium">LG Performance</span> — performance issue</div>
          <div><span className="font-medium">LG Season Complete</span> — seasonal end</div>
          <div><span className="font-medium">Q NCNS</span> — no-call no-show</div>
          <div><span className="font-medium">Q Other Job</span> — took another job</div>
          <div><span className="font-medium">TH Hired</span> — perm hired by client</div>
        </div>
      </div>
    </div>
  )
}
