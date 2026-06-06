import { useState, useRef } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { parseTracker } from '../../lib/parseTracker'

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
        {description && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

export default function SettingsPage() {
  const darkMode = useAppStore((s) => s.darkMode)
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode)
  const importFromData = useAppStore((s) => s.importFromData)
  const importRef = useRef(null)
  const [importMsg, setImportMsg] = useState(null) // { ok, text }

  function exportData() {
    const s = useAppStore.getState()
    const dump = {
      workers: s.workers, openings: s.openings, waitlist: s.waitlist, furloughWorkers: s.furloughWorkers,
      attendanceRecords: s.attendanceRecords, incidents: s.incidents, staffingPlan: s.staffingPlan,
      financials: s.financials, breakfastItems: s.breakfastItems, breakfastNotes: s.breakfastNotes,
      snapshots: s.snapshots, exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `compass-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  async function handleImport(file) {
    if (!file) return
    setImportMsg(null)
    try {
      const buf = await file.arrayBuffer()
      const data = parseTracker(buf)
      const counts = `${data.activeWorkers.length} active · ${data.furloughWorkers.length} furlough · ${data.termedWorkers.length} termed/DNA · ${data.incidents.length} incidents`
      if (!data.activeWorkers.length && !data.termedWorkers.length) {
        setImportMsg({ ok: false, text: "Couldn't find expected sheets — is this the Compass Tracker.xlsx?" })
        return
      }
      importFromData(data)
      setImportMsg({ ok: true, text: `Imported ${counts}. Saved to the server.` })
    } catch (e) {
      setImportMsg({ ok: false, text: `Import failed: ${e.message}` })
    }
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Preferences and configuration</p>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-4 pb-2">Appearance</h2>
        <SettingRow
          label="Dark Mode"
          description="Switch to a dark color scheme. Preference is saved automatically."
        >
          <Toggle checked={darkMode} onChange={toggleDarkMode} />
        </SettingRow>
        <SettingRow
          label="Theme"
          description="More theme options coming soon."
        >
          <span className="text-xs text-gray-400 dark:text-gray-500">Coming soon</span>
        </SettingRow>
      </div>

      {/* Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-4 pb-2">Data</h2>
        <SettingRow
          label="Storage"
          description="All data is saved on the server (shared by everyone). Nothing is stored in your browser."
        >
          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium px-2 py-0.5 rounded-full">
            Server
          </span>
        </SettingRow>
        <SettingRow
          label="Export Data"
          description="Download all records as a JSON backup."
        >
          <button onClick={exportData}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
            Download JSON
          </button>
        </SettingRow>
        <SettingRow
          label="Import from Spreadsheet"
          description="Upload a new Compass Tracker.xlsx to refresh worker data. Replaces workers, openings, waitlist, furlough, attendance & incidents."
        >
          <div className="text-right">
            <input ref={importRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
            <button onClick={() => importRef.current?.click()}
              className="px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
              Upload tracker
            </button>
            {importMsg && <p className={`text-xs mt-1.5 max-w-xs ${importMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{importMsg.text}</p>}
          </div>
        </SettingRow>
      </div>

      {/* Access */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-4 pb-2">Access</h2>
        <SettingRow
          label="Sign-in"
          description="Access is controlled by your company Microsoft account — no separate dashboard login."
        >
          <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-medium px-2 py-0.5 rounded-full">Microsoft</span>
        </SettingRow>
      </div>

      {/* About */}
      <div className="text-xs text-gray-400 dark:text-gray-500 pb-4">
        Compass Minerals Workforce Tracker — v1.0.0 &nbsp;·&nbsp; Built by YES Staffing
      </div>
    </div>
  )
}
