import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import WorkerModal from '../workers/WorkerModal'
import { DEPARTMENTS } from '../../lib/constants'
import { exportToCsv, exportBtnCls } from '../../lib/exportCsv'

const STATUS_STYLES = {
  Termed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  DNA: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
}

export default function TerminationsPage() {
  const workers = useAppStore((s) => s.workers)
  const updateWorker = useAppStore((s) => s.updateWorker)
  const deleteWorker = useAppStore((s) => s.deleteWorker)
  const rehireWorker = useAppStore((s) => s.rehireWorker)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => workers.filter((w) => {
    if (w.status !== 'Termed' && w.status !== 'DNA') return false
    if (statusFilter && w.status !== statusFilter) return false
    if (deptFilter && w.department !== deptFilter) return false
    if (search && !`${w.firstName} ${w.lastName}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [workers, search, deptFilter, statusFilter])

  const termed = workers.filter((w) => w.status === 'Termed').length
  const dna = workers.filter((w) => w.status === 'DNA').length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Terminations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{termed} termed · {dna} DNA — off the active roster</p>
        </div>
        <button onClick={() => exportToCsv('compass-terminations', [
          { key: 'firstName', label: 'First' }, { key: 'lastName', label: 'Last' },
          { key: 'department', label: 'Department' }, { key: 'status', label: 'Status' },
          { key: 'termReason', label: 'Term Reason' }, { key: 'daysWorked', label: 'Days Worked' }, { key: 'notes', label: 'Notes' },
        ], filtered)} className={exportBtnCls}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input type="search" placeholder="Search name…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 w-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-cyan" />
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-cyan">
          <option value="">All Departments</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-cyan">
          <option value="">Termed &amp; DNA</option><option value="Termed">Termed</option><option value="DNA">DNA</option>
        </select>
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{filtered.length} records</span>
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
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No terminations match.</td></tr>
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
