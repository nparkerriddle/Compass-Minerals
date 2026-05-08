import { useAppStore } from '../../store/useAppStore'

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
          description="All data is saved to your browser's local storage. No server required."
        >
          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-medium px-2 py-0.5 rounded-full">
            Local
          </span>
        </SettingRow>
        <SettingRow
          label="Export Data"
          description="Download all records as JSON for backup or migration."
        >
          <span className="text-xs text-gray-400 dark:text-gray-500">Coming soon</span>
        </SettingRow>
        <SettingRow
          label="Import from Spreadsheet"
          description="Re-import updated data from the Compass Tracker.xlsx file."
        >
          <span className="text-xs text-gray-400 dark:text-gray-500">Coming soon</span>
        </SettingRow>
      </div>

      {/* Access */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-4 pb-2">Access</h2>
        <SettingRow
          label="Password Protection"
          description="Require a password to open the dashboard."
        >
          <span className="text-xs text-gray-400 dark:text-gray-500">Coming soon</span>
        </SettingRow>
        <SettingRow
          label="User Roles"
          description="Restrict edit access by role (recruiter, manager, read-only)."
        >
          <span className="text-xs text-gray-400 dark:text-gray-500">Coming soon</span>
        </SettingRow>
      </div>

      {/* About */}
      <div className="text-xs text-gray-400 dark:text-gray-500 pb-4">
        Compass Minerals Workforce Tracker — v1.0.0 &nbsp;·&nbsp; Built by YES Staffing
      </div>
    </div>
  )
}
