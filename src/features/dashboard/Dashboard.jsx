import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import { useCompassData } from './useCompassData'
import { KpiCard } from '../../components/shared/KpiCard'
import { KpiCardSkeleton, ChartSkeleton, TableSkeleton } from '../../components/shared/Skeleton'
import { EmptyState } from '../../components/shared/EmptyState'
import { ErrorCard } from '../../components/shared/ErrorCard'
import { DataTable } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'

const DEPT_COLORS = ['#1f77b4', '#2ca02c', '#ff7f0e', '#9467bd', '#8c564b', '#e377c2', '#17becf']
const SHIFT_COLORS = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#76b7b2']
const TERM_COLORS = ['#d62728', '#ff7f0e', '#bcbd22', '#9467bd', '#8c564b', '#e377c2', '#17becf', '#1f77b4', '#2ca02c', '#aec7e8']

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

const workerColumns = [
  {
    accessorKey: 'name',
    header: 'Worker',
    cell: ({ getValue }) => (
      <span className="font-medium text-gray-900">{getValue()}</span>
    ),
  },
  {
    accessorKey: 'department',
    header: 'Department',
  },
  {
    accessorKey: 'shift',
    header: 'Shift',
    cell: ({ getValue }) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
        {getValue() || '—'}
      </span>
    ),
  },
  {
    accessorKey: 'supervisor',
    header: 'Supervisor',
    cell: ({ getValue }) => getValue() || '—',
  },
  {
    accessorKey: 'daysWorked',
    header: 'Days',
    meta: { numeric: true },
    cell: ({ getValue }) => getValue() || '—',
  },
  {
    accessorKey: 'wage',
    header: 'Wage',
    meta: { numeric: true },
    cell: ({ getValue }) => getValue() ? `$${Number(getValue()).toFixed(2)}/hr` : '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => (
      <StatusBadge status="success" label={getValue()} size="sm" />
    ),
  },
]

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useCompassData()
  const [deptFilter, setDeptFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const filteredWorkers = useMemo(() => {
    if (!data?.activeWorkers) return []
    return data.activeWorkers.filter(w => {
      if (deptFilter && w.department !== deptFilter) return false
      if (shiftFilter && w.shift !== shiftFilter) return false
      return true
    })
  }, [data?.activeWorkers, deptFilter, shiftFilter])

  const table = useReactTable({
    data: filteredWorkers,
    columns: workerColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  const departments = useMemo(() => {
    if (!data?.activeWorkers) return []
    return [...new Set(data.activeWorkers.map(w => w.department))].filter(Boolean).sort()
  }, [data?.activeWorkers])

  const shifts = useMemo(() => {
    if (!data?.activeWorkers) return []
    return [...new Set(data.activeWorkers.map(w => w.shift))].filter(Boolean).sort()
  }, [data?.activeWorkers])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Compass Minerals</h1>
            <p className="text-sm text-gray-500">Workforce Tracker — YES Staffing</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Data as of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-screen-xl mx-auto flex gap-1">
          {['overview', 'workers', 'attrition'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-screen-xl mx-auto px-6 py-6 space-y-6">

        {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Zone 1: KPI Row */}
            <section aria-label="Key metrics">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
                ) : isError ? (
                  <div className="col-span-4">
                    <ErrorCard
                      title="Failed to load metrics"
                      message="Could not read dashboard data."
                      onRetry={refetch}
                    />
                  </div>
                ) : (
                  <>
                    <KpiCard
                      title="Active Workers"
                      value={data.summary.activeWorkers}
                      subtitle="currently on assignment"
                    />
                    <KpiCard
                      title="Open Positions"
                      value={data.summary.openPositions}
                      deltaType={data.summary.openPositions > 0 ? 'negative' : 'neutral'}
                      subtitle="unfilled openings"
                    />
                    <KpiCard
                      title="Waitlist"
                      value={data.summary.waitlistCount}
                      subtitle="candidates ready to place"
                      deltaType="positive"
                    />
                    <KpiCard
                      title="Termed / DNA"
                      value={`${data.summary.termedCount} / ${data.summary.dnaCount}`}
                      subtitle="this season"
                      deltaType="neutral"
                    />
                  </>
                )}
              </div>
            </section>

            {/* Zone 2: Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5" aria-label="Charts">

              {/* Workers by Department */}
              <Card>
                <SectionHeader title="Workers by Department" subtitle="Active placements" />
                {isLoading ? (
                  <ChartSkeleton />
                ) : isError ? (
                  <ErrorCard title="Chart unavailable" onRetry={refetch} />
                ) : data.departmentCounts.length === 0 ? (
                  <EmptyState title="No department data" description="No active workers found." />
                ) : (
                  <div
                    role="img"
                    aria-label={`Bar chart: ${data.departmentCounts.map(d => `${d.department} ${d.count}`).join(', ')}`}
                  >
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={data.departmentCounts}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="department"
                          width={110}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={v => [v, 'Workers']}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {data.departmentCounts.map((_, i) => (
                            <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Workers by Shift */}
              <Card>
                <SectionHeader title="Workers by Shift" subtitle="Active placements" />
                {isLoading ? (
                  <ChartSkeleton />
                ) : isError ? (
                  <ErrorCard title="Chart unavailable" onRetry={refetch} />
                ) : data.shiftCounts.length === 0 ? (
                  <EmptyState title="No shift data" description="No active workers found." />
                ) : (
                  <div
                    role="img"
                    aria-label={`Bar chart: ${data.shiftCounts.map(s => `Shift ${s.shift} ${s.count}`).join(', ')}`}
                  >
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.shiftCounts} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="shift" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={v => [v, 'Workers']}
                          contentStyle={{ fontSize: 12 }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {data.shiftCounts.map((_, i) => (
                            <Cell key={i} fill={SHIFT_COLORS[i % SHIFT_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </section>

            {/* Open Positions */}
            {!isLoading && !isError && data.openings?.length > 0 && (
              <Card>
                <SectionHeader title="Open Positions" subtitle="Unfilled requisitions" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Department</th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Position</th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-500">Date Received</th>
                        <th className="text-right py-2 font-medium text-gray-500">Openings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.openings.map((o, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="py-2.5 pr-4 font-medium text-gray-800">{o.department}</td>
                          <td className="py-2.5 pr-4 text-gray-600">{o.position || '—'}</td>
                          <td className="py-2.5 pr-4 text-gray-500">{o.dateReceived || '—'}</td>
                          <td className="py-2.5 text-right">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                              {o.openings}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ── WORKERS TAB ─────────────────────────────────────────── */}
        {activeTab === 'workers' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by department"
              >
                <option value="">All Departments</option>
                {departments.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={shiftFilter}
                onChange={e => setShiftFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by shift"
              >
                <option value="">All Shifts</option>
                {shifts.map(s => (
                  <option key={s} value={s}>Shift {s}</option>
                ))}
              </select>
              {(deptFilter || shiftFilter) && (
                <button
                  onClick={() => { setDeptFilter(''); setShiftFilter('') }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Clear filters
                </button>
              )}
              <span className="ml-auto text-sm text-gray-500">
                {filteredWorkers.length} of {data?.summary?.activeWorkers ?? 0} workers
              </span>
            </div>

            <Card className="p-0 overflow-hidden">
              {isLoading ? (
                <div className="p-5"><TableSkeleton rows={10} /></div>
              ) : isError ? (
                <div className="p-5">
                  <ErrorCard title="Failed to load workers" onRetry={refetch} />
                </div>
              ) : (
                <DataTable table={table} loading={false} emptyMessage="No workers match the selected filters." />
              )}
            </Card>
          </>
        )}

        {/* ── ATTRITION TAB ───────────────────────────────────────── */}
        {activeTab === 'attrition' && (
          <>
            {/* Attrition KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <KpiCardSkeleton key={i} />)
              ) : (
                <>
                  <KpiCard
                    title="Total Termed"
                    value={data.summary.termedCount}
                    subtitle="this season"
                    deltaType="negative"
                  />
                  <KpiCard
                    title="DNA"
                    value={data.summary.dnaCount}
                    subtitle="did not advance"
                    deltaType="neutral"
                  />
                  <KpiCard
                    title="Total Separations"
                    value={data.summary.termedCount + data.summary.dnaCount}
                    subtitle="termed + DNA"
                    deltaType="negative"
                  />
                </>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Terminations by Department */}
              <Card>
                <SectionHeader title="Terminations by Department" subtitle="All-time totals" />
                {isLoading ? (
                  <ChartSkeleton />
                ) : isError ? (
                  <ErrorCard title="Chart unavailable" onRetry={refetch} />
                ) : !data.deptAttrition?.length ? (
                  <EmptyState title="No attrition data" />
                ) : (
                  <div role="img" aria-label="Terminations by department chart">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={data.deptAttrition}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="department" width={130} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [v, 'Terminations']} contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="terminations" fill="#d62728" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Term Reasons */}
              <Card>
                <SectionHeader title="Termination Reasons" subtitle="Top reasons workers separated" />
                {isLoading ? (
                  <ChartSkeleton />
                ) : isError ? (
                  <ErrorCard title="Chart unavailable" onRetry={refetch} />
                ) : !data.termReasons?.length ? (
                  <EmptyState title="No term reason data" />
                ) : (
                  <div role="img" aria-label="Termination reasons chart">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={data.termReasons.slice(0, 10)}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="reason" width={150} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [v, 'Count']} contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {data.termReasons.slice(0, 10).map((_, i) => (
                            <Cell key={i} fill={TERM_COLORS[i % TERM_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>

            {/* Reason legend */}
            {!isLoading && !isError && (
              <Card>
                <SectionHeader title="Reason Code Key" subtitle="LG = let go, Q = quit, TH = transferred/hired" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600">
                  <div><span className="font-medium">LG Attendance</span> — Let go for attendance</div>
                  <div><span className="font-medium">LG Performance</span> — Let go for performance</div>
                  <div><span className="font-medium">LG Season Complete</span> — Seasonal end</div>
                  <div><span className="font-medium">LG Gross Misconduct</span> — Misconduct termination</div>
                  <div><span className="font-medium">Q Other Job</span> — Quit for other employment</div>
                  <div><span className="font-medium">Q NCNS</span> — Quit via no-call no-show</div>
                  <div><span className="font-medium">Q Personal</span> — Personal reasons</div>
                  <div><span className="font-medium">Q Schedule Issues</span> — Schedule conflict</div>
                  <div><span className="font-medium">TH Hired</span> — Transferred / perm hired</div>
                </div>
              </Card>
            )}
          </>
        )}

      </main>
    </div>
  )
}
