import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { DEPARTMENTS, SHIFTS, STATUSES, TERM_REASONS } from '../../lib/constants'
import { useAppStore } from '../../store/useAppStore'

const EMPTY = {
  firstName: '', lastName: '', department: '', shift: '',
  supervisor: '', startDate: '', daysWorked: '', wage: '',
  status: 'Active', termReason: '', notes: '',
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400'
const selectCls = inputCls

export default function WorkerModal({ isOpen, onClose, onSave, initial = null }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [errors, setErrors] = useState({})
  const workers = useAppStore((s) => s.workers)

  // Soft duplicate-name warning (doesn't block saving)
  const dupName = !!form.firstName.trim() && !!form.lastName.trim() && workers.some((w) =>
    w.id !== initial?.id &&
    w.firstName.trim().toLowerCase() === form.firstName.trim().toLowerCase() &&
    w.lastName.trim().toLowerCase() === form.lastName.trim().toLowerCase()
  )

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    return e
  }

  function handleSave() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({
      ...form,
      daysWorked: Number(form.daysWorked) || 0,
      wage: Number(form.wage) || 0,
    })
    setForm(EMPTY)
    setErrors({})
    onClose()
  }

  function handleClose() {
    setForm(EMPTY)
    setErrors({})
    onClose()
  }

  const isInactive = form.status !== 'Active'

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initial ? 'Edit Worker' : 'Add Worker'}
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            {initial ? 'Save Changes' : 'Add Worker'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" required>
            <input className={inputCls} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First" />
            {errors.firstName && <p className="text-xs text-red-500 mt-0.5">{errors.firstName}</p>}
          </Field>
          <Field label="Last Name" required>
            <input className={inputCls} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last" />
            {errors.lastName && <p className="text-xs text-red-500 mt-0.5">{errors.lastName}</p>}
          </Field>
        </div>
        {dupName && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 -mt-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
            A worker with this name already exists — you can still save if intended.
          </p>
        )}

        {/* Department + Shift */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Department">
            <select className={selectCls} value={form.department} onChange={(e) => set('department', e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Shift">
            <select className={selectCls} value={form.shift} onChange={(e) => set('shift', e.target.value)}>
              <option value="">Select shift</option>
              {SHIFTS.map((s) => <option key={s} value={s}>Shift {s}</option>)}
            </select>
          </Field>
        </div>

        {/* Supervisor + Start Date */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Supervisor">
            <input className={inputCls} value={form.supervisor} onChange={(e) => set('supervisor', e.target.value)} placeholder="Supervisor name" />
          </Field>
          <Field label="Start Date">
            <input type="date" className={inputCls} value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
        </div>

        {/* Days + Wage + Status */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Days Worked">
            <input type="number" min="0" className={inputCls} value={form.daysWorked} onChange={(e) => set('daysWorked', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Wage ($/hr)">
            <input type="number" min="0" step="0.25" className={inputCls} value={form.wage} onChange={(e) => set('wage', e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Status">
            <select className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        {/* Term Reason (shown when status is not Active) */}
        {isInactive && (
          <Field label="Term / DNA Reason">
            <select className={selectCls} value={form.termReason} onChange={(e) => set('termReason', e.target.value)}>
              <option value="">Select reason</option>
              {TERM_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        )}

        {/* Notes */}
        <Field label="Notes">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Optional notes..."
          />
        </Field>
      </div>
    </Modal>
  )
}
