import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Modal from '../../components/ui/Modal'

const inputCls = 'w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

// ── Item Add/Edit Modal ───────────────────────────────────────────────────────
function ItemModal({ isOpen, onClose, onSave, initial = null }) {
  const [item, setItem] = useState(initial?.item ?? '')
  const [amount, setAmount] = useState(initial?.amount ?? '')
  const [error, setError] = useState('')

  function handleSave() {
    if (!item.trim()) { setError('Item name is required'); return }
    onSave({ item: item.trim(), amount: amount.trim() })
    setItem(''); setAmount(''); setError(''); onClose()
  }
  function handleClose() { setItem(''); setAmount(''); setError(''); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={initial ? 'Edit Supply Item' : 'Add Supply Item'}
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{initial ? 'Save' : 'Add'}</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Item Name <span className="text-red-500">*</span></label>
          <input className={inputCls} value={item} onChange={(e) => { setItem(e.target.value); setError('') }} placeholder="e.g. Pancake Mix" />
          {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount / Quantity</label>
          <input className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5–6 total" />
        </div>
      </div>
    </Modal>
  )
}

// ── Note Add/Edit Modal ───────────────────────────────────────────────────────
function NoteModal({ isOpen, onClose, onSave, initial = null }) {
  const [text, setText] = useState(initial?.text ?? '')
  const [error, setError] = useState('')

  function handleSave() {
    if (!text.trim()) { setError('Note cannot be empty'); return }
    onSave(text.trim())
    setText(''); setError(''); onClose()
  }
  function handleClose() { setText(''); setError(''); onClose() }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={initial ? 'Edit Note' : 'Add Note'}
      footer={
        <>
          <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">{initial ? 'Save' : 'Add'}</button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Note <span className="text-red-500">*</span></label>
        <textarea className={`${inputCls} resize-none`} rows={3} value={text} onChange={(e) => { setText(e.target.value); setError('') }} placeholder="Operational tip or instruction..." />
        {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
      </div>
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BreakfastPage() {
  const items              = useAppStore((s) => s.breakfastItems)
  const notes              = useAppStore((s) => s.breakfastNotes)
  const toggleBreakfastItem  = useAppStore((s) => s.toggleBreakfastItem)
  const addBreakfastItem     = useAppStore((s) => s.addBreakfastItem)
  const updateBreakfastItem  = useAppStore((s) => s.updateBreakfastItem)
  const deleteBreakfastItem  = useAppStore((s) => s.deleteBreakfastItem)
  const resetBreakfastItems  = useAppStore((s) => s.resetBreakfastItems)
  const addBreakfastNote     = useAppStore((s) => s.addBreakfastNote)
  const updateBreakfastNote  = useAppStore((s) => s.updateBreakfastNote)
  const deleteBreakfastNote  = useAppStore((s) => s.deleteBreakfastNote)

  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState(null)
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState(null)

  const doneCount = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0
  const sortedNotes = [...notes].sort((a, b) => a.order - b.order)

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Spring Breakfast</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Plant breakfast supply checklist — 225 people per day</p>
        </div>
        <button onClick={() => setConfirmReset(true)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 transition-colors">
          Reset All
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{doneCount} / {items.length} items</span>
        </div>
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && (
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1.5">All items checked off!</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Supply Checklist ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Supply Checklist</h2>
            <button onClick={() => { setEditingItem(null); setItemModalOpen(true) }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Item
            </button>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 group transition-colors ${item.done ? 'bg-green-50/50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
              >
                {/* Checkbox — clicking row toggles */}
                <button
                  onClick={() => toggleBreakfastItem(item.id)}
                  className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                  aria-label={item.done ? 'Mark not done' : 'Mark done'}
                >
                  {item.done && (
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleBreakfastItem(item.id)}>
                  <span className={`text-sm font-medium ${item.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>
                    {item.item}
                  </span>
                  {item.amount && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{item.amount}</span>
                  )}
                </div>

                {/* Row actions */}
                <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingItem(item); setItemModalOpen(true) }}
                    className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button onClick={() => setConfirmDeleteItemId(item.id)}
                    className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Notes & Tips ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notes & Tips</h2>
            <button onClick={() => { setEditingNote(null); setNoteModalOpen(true) }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Note
            </button>
          </div>

          <ol className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {sortedNotes.map((note, i) => (
              <li key={note.id} className="flex items-start gap-3 px-4 py-3 group hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{note.text}</span>
                <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingNote(note); setNoteModalOpen(true) }}
                    className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </button>
                  <button onClick={() => setConfirmDeleteNoteId(note.id)}
                    className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Modals */}
      <ItemModal
        isOpen={itemModalOpen}
        onClose={() => { setItemModalOpen(false); setEditingItem(null) }}
        onSave={(data) => {
          if (editingItem) updateBreakfastItem(editingItem.id, data)
          else addBreakfastItem(data)
        }}
        initial={editingItem}
      />

      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => { setNoteModalOpen(false); setEditingNote(null) }}
        onSave={(text) => {
          if (editingNote) updateBreakfastNote(editingNote.id, text)
          else addBreakfastNote(text)
        }}
        initial={editingNote}
      />

      {/* Reset confirm */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Reset all checkboxes?</h3>
            <p className="text-sm text-gray-500 mb-5">All items will be marked unchecked. The list itself will not change.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmReset(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={() => { resetBreakfastItems(); setConfirmReset(false) }} className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete item confirm */}
      {confirmDeleteItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete this item?</h3>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setConfirmDeleteItemId(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={() => { deleteBreakfastItem(confirmDeleteItemId); setConfirmDeleteItemId(null) }} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete note confirm */}
      {confirmDeleteNoteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete this note?</h3>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setConfirmDeleteNoteId(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={() => { deleteBreakfastNote(confirmDeleteNoteId); setConfirmDeleteNoteId(null) }} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
