import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import { DEPARTMENTS, SHIFTS, WAITLIST_STATUSES } from '../../lib/constants'

const EMPTY = { firstName: '', lastName: '', department: '', preferredShift: '', phone: '', status: 'Pending', notes: '' }

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

export default function WaitlistModal({ isOpen, onClose, onSave, initial = null }) {
  const [form, setForm] = useState(initial ?? EMPTY)
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: null }))
  }

  function handleSave() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Required'
    if (!form.lastName.trim()) e.lastName = 'Required'
    if (Object.keys(e).length) { setErrors(e); return }
    onSave(form)
    setForm(EMPTY)
    setErrors({})
    onClose()
  }

  function handleClose() { setForm(EMPTY); setErrors({}); onClose() }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={initial ? 'Edit Candidate' : 'Add Candidate'}
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            {initial ? 'Save Changes' : 'Add Candidate'}
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
          <Field label="Preferred Shift">
            <select className={inputCls} value={form.preferredShift} onChange={(e) => set('preferredShift', e.target.value)}>
              <option value="">Any shift</option>
              {SHIFTS.map((s) => <option key={s} value={s}>Shift {s}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">
            <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(435) 000-0000" />
          </Field>
          <Field label="Status">
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {WAITLIST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Experience, referral source, etc." />
        </Field>
      </div>
    </Modal>
  )
}
