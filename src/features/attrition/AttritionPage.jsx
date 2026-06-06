import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useAppStore } from '../../store/useAppStore'
import WorkerModal from '../workers/WorkerModal'
import { DEPARTMENTS } from '../../lib/constants'
import { exportToCsv, exportBtnCls } from '../../lib/exportCsv'

const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']
const STATUS_STYLES = {
  Termed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  DNA: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
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

export default function AttritionPage() {
  const workers = useAppStore((s) => s.workers)
  const darkMode = useAppStore((s) => s.darkMode)
  const updateWorker = useAppStore((s) => s.updateWorker)
  const deleteWorker = useAppStore((s) => s.deleteWorker)
  const rehireWorker = useAppStore((s) => s.rehireWorker)

  const axisColor = darkMode ? '#9ca3af' : '#6b7280'
  const gridColor = darkMode ? '#374151' : '#e5e7eb'
  const tooltipStyle = { fontSize: 12, borderRadius: 8, border: `1px solid ${gridColor}`, background: darkMode ? '#1f2937' : '#ffffff', color: darkMode ? '#e5e7eb' : '#111827' }

  const termed = useMemo(() => workers.filter((w) => w.status === 'Termed'), [workers])
  const dna = useMemo(() => workers.filter((w) => w.status === 'DNA'), [workers])

  const deptAttrition = useMemo(() => {
    const map = {}
    ;[...termed, ...dna].forEach((w) => { map[w.department || 'Unknown'] = (map[w.department || 'Unknown'] || 0) + 1 })
    return Object.entries(map).map(([department, count]) => ({ department, count })).sort((a, b) => b.count - a.count)
  }, [termed, dna])

  const termReasons = useMemo(() => {
    const map = {}
    termed.forEach((w) => { if (w.termReason) map[w.termReason] = (map[w.termReason] || 0) + 1 })
    return Object.entries(map).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count)
  }, [termed])

  const voluntaryCount = termed.filter((w) => w.termReason?.startsWith('Q') || w.termReason === 'TH Hired').length
  const involuntaryCount = termed.filter((w) => w.termReason?.startsWith('LG')).length

  // ── Terminations list ──
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const filtered = useMemo(() => workers.filter((w) => {
    if (w.status !== 'Termed' && w.status !== 'DNA') return false
    if (statusFilter && w.status !== statusFilter) return false
    if (deptFilter && w.department !== deptFilter) return false
    if (search && !`${w.firstName} ${w.lastName}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [workers, search, deptFilter, statusFilter])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Terminations &amp; Attrition</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Separation records and analytics — computed live from worker data</p>
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

      {/* Charts */}
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
            <p className="text-sm text-gray-400 py-10 text-center">No term reasons recorded yet.</p>
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

      {/* Termination records list */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Termination Records</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input type="search" placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 w-48 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-cyan" />
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-cyan">
            <option value="">All Departments</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-cyan">
            <option value="">Termed &amp; DNA</option><option value="Termed">Termed</option><option value="DNA">DNA</option>
          </select>
          <button onClick={() => exportToCsv('compass-terminations', [
            { key: 'firstName', label: 'First' }, { key: 'lastName', label: 'Last' }, { key: 'department', label: 'Department' },
            { key: 'status', label: 'Status' }, { key: 'termReason', label: 'Term Reason' }, { key: 'daysWorked', label: 'Days Worked' }, { key: 'notes', label: 'Notes' },
          ], filtered)} className={exportBtnCls}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            CSV
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-semibold">Name</th><th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Term Reason</th>
                <th className="px-4 py-3 font-semibold text-right">Days</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No termination records match.</td></tr>
              ) : filtered.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group cursor-pointer" onClick={() => { setEditing(w); setModalOpen(true) }}>
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{w.firstName} {w.lastName}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{w.department || '—'}</td>
                  <td className="px-4 py-2.5"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[w.status] || ''}`}>{w.status}</span></td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{w.termReason || '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{w.daysWorked || '—'}</td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => rehireWorker(w.id)} title="Rehire (→ Active)" className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                      </button>
                      <button onClick={() => setConfirmId(w.id)} title="Delete" className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M18.16 5.79a48.108 48.108 0 00-3.478-.397" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reason code legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Term Reason Code Key</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div><span className="font-medium text-gray-800 dark:text-gray-200">LG</span> = Let go (involuntary)</div>
          <div><span className="font-medium text-gray-800 dark:text-gray-200">Q</span> = Quit (voluntary)</div>
          <div><span className="font-medium text-gray-800 dark:text-gray-200">TH</span> = Transferred / hired perm</div>
        </div>
      </div>

      {modalOpen && (
        <WorkerModal isOpen={modalOpen} initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={(data) => { if (editing) updateWorker(editing.id, data) }} />
      )}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete record?</h3>
            <p className="text-sm text-gray-500 mb-5">This permanently removes the worker record. This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={() => { deleteWorker(confirmId); setConfirmId(null) }} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
