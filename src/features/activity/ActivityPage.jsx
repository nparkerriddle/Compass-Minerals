import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'

const ACTION_STYLES = {
  Added: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  Edited: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  Deleted: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  Returned: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
}

function when(iso) {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ActivityPage() {
  const activityLog = useAppStore((s) => s.activityLog)
  const clearActivityLog = useAppStore((s) => s.clearActivityLog)
  const [confirm, setConfirm] = useState(false)

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Activity Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Recent changes across the dashboard ({activityLog.length})</p>
        </div>
        {activityLog.length > 0 && (
          <button onClick={() => setConfirm(true)}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            Clear log
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700/60">
        {activityLog.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">No activity recorded yet. Changes you make will appear here.</div>
        ) : (
          activityLog.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 w-20 justify-center ${ACTION_STYLES[e.action] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{e.action}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 w-24 shrink-0">{e.entity}</span>
              <span className="text-sm text-gray-900 dark:text-gray-100 flex-1 truncate">{e.label}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{when(e.at)}</span>
            </div>
          ))
        )}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Clear activity log?</h3>
            <p className="text-sm text-gray-500 mb-5">This removes all recorded history. It cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={() => { clearActivityLog(); setConfirm(false) }} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
