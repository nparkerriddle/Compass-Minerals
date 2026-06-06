import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useAppStore } from '../../store/useAppStore'
import { isAtRisk } from '../../lib/attendance'

const DEPT_COLORS  = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16']
const SHIFT_COLORS = ['#3b82f6','#f59e0b','#10b981','#ef4444','#8b5cf6']

// Tile colors + hover ring
const TILE_THEMES = {
  blue:   { wrap: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-500', val: 'text-blue-700 dark:text-blue-400' },
  amber:  { wrap: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-400', val: 'text-amber-700 dark:text-amber-400' },
  green:  { wrap: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:border-green-400', val: 'text-green-700 dark:text-green-400' },
  red:    { wrap: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:border-red-400', val: 'text-red-700 dark:text-red-400' },
  purple: { wrap: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:border-purple-400', val: 'text-purple-700 dark:text-purple-400' },
  sky:    { wrap: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 hover:border-sky-400', val: 'text-sky-700 dark:text-sky-400' },
  orange: { wrap: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:border-orange-400', val: 'text-orange-700 dark:text-orange-400' },
}

function KpiTile({ label, value, sub, color = 'blue', onClick }) {
  const t = TILE_THEMES[color]
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-5 transition-all ${t.wrap} ${onClick ? 'cursor-pointer hover:shadow-md group' : ''}`}
      title={onClick ? `Go to ${label}` : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
        {onClick && (
          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        )}
      </div>
      <div className={`text-3xl font-bold mt-1 ${t.val}`}>{value}</div>
      {sub && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

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

export default function OverviewPage() {
  const navigate         = useAppStore((s) => s.navigate)
  const darkMode         = useAppStore((s) => s.darkMode)
  const workers          = useAppStore((s) => s.workers)
  const openings         = useAppStore((s) => s.openings)
  const waitlist         = useAppStore((s) => s.waitlist)
  const furloughWorkers    = useAppStore((s) => s.furloughWorkers)
  const attendanceRecords  = useAppStore((s) => s.attendanceRecords)

  const active   = useMemo(() => workers.filter((w) => w.status === 'Active'), [workers])
  const termed   = useMemo(() => workers.filter((w) => w.status === 'Termed'), [workers])
  const dna      = useMemo(() => workers.filter((w) => w.status === 'DNA'), [workers])
  const onFurlough   = useMemo(() => furloughWorkers.filter((w) => w.status === 'On Furlough'), [furloughWorkers])
  const atRisk       = useMemo(() => attendanceRecords.filter(isAtRisk), [attendanceRecords])

  const deptCounts = useMemo(() => {
    const map = {}
    active.forEach((w) => { map[w.department || 'Unknown'] = (map[w.department || 'Unknown'] || 0) + 1 })
    return Object.entries(map).map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count)
  }, [active])

  const shiftCounts = useMemo(() => {
    const map = {}
    active.forEach((w) => { map[w.shift || 'Unknown'] = (map[w.shift || 'Unknown'] || 0) + 1 })
    return Object.entries(map).map(([shift, count]) => ({ shift, count })).sort((a, b) => b.count - a.count)
  }, [active])

  const termReasons = useMemo(() => {
    const map = {}
    termed.forEach((w) => { if (w.termReason) map[w.termReason] = (map[w.termReason] || 0) + 1 })
    return Object.entries(map).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 8)
  }, [termed])

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Overview</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Click any tile to jump to that section</p>
      </div>

      {/* KPI row — all clickable */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Active Workers"  value={active.length}      sub="on assignment"        color="blue"   onClick={() => navigate('workers')} />
        <KpiTile label="Open Positions"  value={openings.length}    sub="unfilled"             color="amber"  onClick={() => navigate('openings')} />
        <KpiTile label="Waitlist"        value={waitlist.length}    sub="candidates"           color="green"  onClick={() => navigate('waitlist')} />
        <KpiTile label="On Furlough"     value={onFurlough.length}  sub="off-season"           color="sky"    onClick={() => navigate('furlough')} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Termed"          value={termed.length}      sub="this season"          color="red"    onClick={() => navigate('attrition')} />
        <KpiTile label="DNA"             value={dna.length}         sub="did not advance"      color="purple" onClick={() => navigate('attrition')} />
        <KpiTile label="At Risk"         value={atRisk.length}      sub="7+ attendance pts"    color="amber"  onClick={() => navigate('attendance')} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Active Workers by Department">
          {deptCounts.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No active workers</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={deptCounts} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis type="category" dataKey="department" width={110} tick={{ fontSize: 11, fill: axisColor }} />
                <Tooltip formatter={(v) => [v, 'Workers']} contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {deptCounts.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Active Workers by Shift">
          {shiftCounts.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No active workers</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={shiftCounts} margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="shift" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} />
                <Tooltip formatter={(v) => [v, 'Workers']} contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {shiftCounts.map((_, i) => <Cell key={i} fill={SHIFT_COLORS[i % SHIFT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {termReasons.length > 0 && (
        <ChartCard title="Top Termination Reasons" sub="From termed worker records">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={termReasons} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
              <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis type="category" dataKey="reason" width={160} tick={{ fontSize: 11, fill: axisColor }} />
              <Tooltip formatter={(v) => [v, 'Workers']} contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  )
}
