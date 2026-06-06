import { useState, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Modal from '../../components/ui/Modal'

const inputCls = 'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
const EMPTY = { role: '', actual: 0, target: 0 }

function RoleModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [error, setError] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  function save() {
    if (!form.role.trim()) { setError('Role name is required'); return }
    onSave({ role: form.role.trim(), actual: Number(form.actual) || 0, target: Number(form.target) || 0 })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit Role' : 'Add Role'} size="sm"
      footer={<>
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
        <button onClick={save} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{initial ? 'Save' : 'Add'}</button>
      </>}>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Role</label>
          <input className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)} placeholder="e.g. Haul Truck Drivers" />
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Actual (current)</label>
            <input type="number" min="0" className={inputCls} value={form.actual} onChange={(e) => set('actual', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">AOP target</label>
            <input type="number" min="0" className={inputCls} value={form.target} onChange={(e) => set('target', e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  )
}

function RoleRow({ r, onEdit, onDelete }) {
  const gap = r.target - r.actual
  const pct = r.target > 0 ? Math.min(100, (r.actual / r.target) * 100) : (r.actual > 0 ? 100 : 0)
  const barColor = gap > 0 ? 'bg-amber-500' : gap < 0 ? 'bg-blue-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 last:border-0 group">
      <div className="w-48 shrink-0 text-sm font-medium text-gray-800 dark:text-gray-200">{r.role}</div>
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="w-16 text-right text-sm tabular-nums text-gray-900 dark:text-gray-100">{r.actual}<span className="text-gray-400"> / {r.target}</span></div>
      <div className="w-20 text-right text-sm tabular-nums font-semibold">
        {gap > 0
          ? <span className="text-amber-600 dark:text-amber-400">−{gap} short</span>
          : gap < 0
            ? <span className="text-blue-600 dark:text-blue-400">+{-gap} over</span>
            : <span className="text-green-600 dark:text-green-400">on plan</span>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onEdit} className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Edit">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
        </button>
        <button onClick={onDelete} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166M18.16 5.79a48.108 48.108 0 00-3.478-.397m0 0a48.11 48.11 0 00-3.478 0M4.772 5.79a48.108 48.108 0 013.478-.397" /></svg>
        </button>
      </div>
    </div>
  )
}

function Tile({ label, value, sub, color, val }) {
  return (
    <div className={`rounded-xl border p-5 ${color}`}>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={`text-3xl font-bold ${val}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function StaffingPage() {
  const staffingPlan = useAppStore((s) => s.staffingPlan)
  const addStaffingRole = useAppStore((s) => s.addStaffingRole)
  const updateStaffingRole = useAppStore((s) => s.updateStaffingRole)
  const deleteStaffingRole = useAppStore((s) => s.deleteStaffingRole)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const totals = useMemo(() => {
    const actual = staffingPlan.reduce((s, r) => s + (r.actual || 0), 0)
    const target = staffingPlan.reduce((s, r) => s + (r.target || 0), 0)
    const openToPlan = Math.max(0, target - actual)
    const fillRate = target > 0 ? Math.round((actual / target) * 100) : 0
    return { actual, target, openToPlan, fillRate }
  }, [staffingPlan])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Staffing Plan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Current headcount vs. the Annual Operating Plan (AOP) target</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Role
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Tile label="Current headcount" value={totals.actual} sub="across all roles" color="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" val="text-blue-700 dark:text-blue-400" />
        <Tile label="AOP target" value={totals.target} sub="planned" color="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" val="text-gray-700 dark:text-gray-300" />
        <Tile label="Open to plan" value={totals.openToPlan} sub="still to fill" color="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" val="text-amber-700 dark:text-amber-400" />
        <Tile label="Fill rate" value={`${totals.fillRate}%`} sub="of plan staffed" color="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" val="text-green-700 dark:text-green-400" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <div className="w-48 shrink-0">Role</div>
          <div className="flex-1">Actual vs. plan</div>
          <div className="w-16 text-right">Act / AOP</div>
          <div className="w-20 text-right">Gap</div>
          <div className="w-[68px]" />
        </div>
        {staffingPlan.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No roles yet. Click "Add Role" to start.</div>
        ) : (
          staffingPlan.map((r) => (
            <RoleRow key={r.id} r={r}
              onEdit={() => { setEditing(r); setModalOpen(true) }}
              onDelete={() => setConfirmId(r.id)} />
          ))
        )}
      </div>

      {modalOpen && (
        <RoleModal isOpen={modalOpen} initial={editing}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={(data) => { if (editing) updateStaffingRole(editing.id, data); else addStaffingRole(data) }} />
      )}

      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete role?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmId(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={() => { deleteStaffingRole(confirmId); setConfirmId(null) }} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
