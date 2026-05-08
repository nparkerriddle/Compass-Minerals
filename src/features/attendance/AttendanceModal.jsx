import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { DEPARTMENTS, SHIFTS } from '../../lib/constants'

const EMPTY = {
  firstName: '', lastName: '', department: '', shift: '', supervisor: '',
  attendancePoints: 0, wage: 0, notes: '',
}

const inputCls = 'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

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

export default function AttendanceModal({ isOpen, onClose, onSave, initial = null }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [errors, setErrors] = useState({})

  useState(() => { setForm(initial ?? EMPTY); setErrors({}) }, [initial, isOpen])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function handleSave() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form, attendancePoints: Number(form.attendancePoints) || 0, wage: Number(form.wage) || 0 })
    setForm(EMPTY)
    setErrors({})
    onClose()
  }

  function handleClose() { setForm(EMPTY); setErrors({}); onClose() }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initial ? 'Edit Attendance Record' : 'Add Attendance Record'}
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            {initial ? 'Save Changes' : 'Add Record'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
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

        <div className="grid grid-cols-2 gap-4">
          <Field label="Department">
            <select className={inputCls} value={form.department} onChange={(e) => set('department', e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Shift">
            <select className={inputCls} value={form.shift} onChange={(e) => set('shift', e.target.value)}>
              <option value="">Select shift</option>
              {SHIFTS.map((s) => <option key={s} value={s}>Shift {s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Supervisor">
          <input className={inputCls} value={form.supervisor} onChange={(e) => set('supervisor', e.target.value)} placeholder="Name" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Attendance Points">
            <input
              type="number" min="0" step="0.5"
              className={inputCls}
              value={form.attendancePoints}
              onChange={(e) => set('attendancePoints', e.target.value)}
            />
          </Field>
          <Field label="Wage ($/hr)">
            <input
              type="number" min="0" step="0.25"
              className={inputCls}
              value={form.wage}
              onChange={(e) => set('wage', e.target.value)}
            />
          </Field>
        </div>

        {/* Point scale reference */}
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Point Scale</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <span><span className="font-semibold text-yellow-600">3 pts</span> — Verbal warning</span>
            <span><span className="font-semibold text-orange-600">5 pts</span> — Written up</span>
            <span><span className="font-semibold text-red-600">7 pts</span> — Write up + Suspension</span>
            <span><span className="font-semibold text-red-800 dark:text-red-400">8 pts</span> — Termination</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1.5">2 NCNS in a row = Termination</div>
        </div>

        <Field label="Notes">
          <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes..." />
        </Field>
      </div>
    </Modal>
  )
}
