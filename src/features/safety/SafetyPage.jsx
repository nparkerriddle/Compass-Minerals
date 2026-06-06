import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Modal from '../../components/ui/Modal'
import { DEPARTMENTS } from '../../lib/constants'
import { exportToCsv, exportBtnCls } from '../../lib/exportCsv'

const inputCls = 'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-cyan'
const OUTCOMES = ['Near Miss', 'First Aid', 'Injury', 'Medical', 'Property Damage', 'Termination', 'Other']
const EMPTY = { firstName: '', lastName: '', date: '', department: '', shift: '', supervisor: '', outcome: '', notes: '' }

function IncidentModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Incident' : 'Log Incident'} size="lg"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
        <button onClick={() => { onSave(form); onClose() }} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{initial ? 'Save' : 'Log'}</button>
      </>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">First Name</label><input className={inputCls} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last Name</label><input className={inputCls} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label><input type="date" className={inputCls} value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Outcome</label>
            <select className={inputCls} value={form.outcome} onChange={(e) => set('outcome', e.target.value)}>
              <option value="">Select outcome</option>{OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Department</label>
            <select className={inputCls} value={form.department} onChange={(e) => set('department', e.target.value)}>
              <option value="">Select</option>{DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Supervisor</label><input className={inputCls} value={form.supervisor} onChange={(e) => set('supervisor', e.target.value)} /></div>
        </div>
        <div><label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label><textarea rows={3} className={`${inputCls} resize-none`} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
      </div>
    </Modal>
  )
}

function Tile({ label, value, color, val }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${val}`}>{value}</div>
    </div>
  )
}

export default function SafetyPage() {
  const incidents = useAppStore((s) => s.incidents)
  const addIncident = useAppStore((s) => s.addIncident)
  const updateIncident = useAppStore((s) => s.updateIncident)
  const deleteIncident = useAppStore((s) => s.deleteIncident)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => incidents.filter((i) =>
    !search || `${i.firstName} ${i.lastName} ${i.department} ${i.outcome}`.toLowerCase().includes(search.toLowerCase())
  ), [incidents, search])

  const total = incidents.length
  const injuries = incidents.filter((i) => /injur|medical|first aid/i.test(i.outcome)).length
  const terms = incidents.filter((i) => /termination/i.test(i.outcome)).length
  const thisYear = incidents.filter((i) => String(i.date).includes(String(new Date().getFullYear()))).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Safety &amp; Incidents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Injuries, incidents, and outcomes on site</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportToCsv('compass-incidents', [
            { key: 'date', label: 'Date' }, { key: 'firstName', label: 'First' }, { key: 'lastName', label: 'Last' },
            { key: 'department', label: 'Department' }, { key: 'shift', label: 'Shift' }, { key: 'supervisor', label: 'Supervisor' },
            { key: 'outcome', label: 'Outcome' }, { key: 'notes', label: 'Notes' },
          ], filtered)} className={exportBtnCls}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Export CSV
          </button>
          <button onClick={() => { setEditing(null); setModalOpen(true) }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Log Incident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Total Incidents" value={total} color="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" val="text-gray-700 dark:text-gray-300" />
        <Tile label="Injuries / Medical" value={injuries} color="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" val="text-red-700 dark:text-red-400" />
        <Tile label="Terminations" value={terms} color="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800" val="text-orange-700 dark:text-orange-400" />
        <Tile label={`Logged in ${new Date().getFullYear()}`} value={thisYear} color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" val="text-blue-700 dark:text-blue-400" />
      </div>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search incidents…"
        className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-cyan w-64" />

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Department</th><th className="px-4 py-3 font-semibold">Supervisor</th>
                <th className="px-4 py-3 font-semibold">Outcome</th><th className="px-4 py-3 font-semibold">Notes</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">No incidents logged.</td></tr>
              ) : filtered.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group cursor-pointer" onClick={() => { setEditing(i); setModalOpen(true) }}>
                  <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 whitespace-nowrap">{i.date || '—'}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{i.firstName} {i.lastName}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{i.department || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{i.supervisor || '—'}</td>
                  <td className="px-4 py-2.5">{i.outcome ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{i.outcome}</span> : '—'}</td>
                  <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 max-w-xs truncate">{i.notes}</td>
                  <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setConfirmId(i.id)} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M18.16 5.79a48.108 48.108 0 00-3.478-.397" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <IncidentModal isOpen={modalOpen} initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={(data) => { if (editing) updateIncident(editing.id, data); else addIncident(data) }} />
      )}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete incident?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={() => { deleteIncident(confirmId); setConfirmId(null) }} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
