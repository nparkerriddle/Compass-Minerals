import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { DEPARTMENTS } from '../../lib/constants'

const EMPTY = { department: '', position: '', dateReceived: '', openingsCount: 1, notes: '' }

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

export default function OpeningModal({ isOpen, onClose, onSave, initial = null }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function handleSave() {
    const e = {}
    if (!form.department.trim()) e.department = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form, openingsCount: Number(form.openingsCount) || 1 })
    setForm(EMPTY)
    setErrors({})
    onClose()
  }

  function handleClose() { setForm(EMPTY); setErrors({}); onClose() }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initial ? 'Edit Opening' : 'Add Opening'}
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            {initial ? 'Save Changes' : 'Add Opening'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Department" required>
            <select className={inputCls} value={form.department} onChange={(e) => set('department', e.target.value)}>
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="text-xs text-red-500 mt-0.5">{errors.department}</p>}
          </Field>
          <Field label="Position">
            <input className={inputCls} value={form.position} onChange={(e) => set('position', e.target.value)} placeholder="e.g. Production" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date Received">
            <input type="date" className={inputCls} value={form.dateReceived} onChange={(e) => set('dateReceived', e.target.value)} />
          </Field>
          <Field label="# of Openings">
            <input type="number" min="1" className={inputCls} value={form.openingsCount} onChange={(e) => set('openingsCount', e.target.value)} />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional notes..." />
        </Field>
      </div>
    </Modal>
  )
}
