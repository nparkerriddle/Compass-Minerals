import { useAppStore } from '../../store/useAppStore'
import { isAtRisk } from '../../lib/attendance'
import { ICONS, NAV_GROUPS } from '../../lib/nav.jsx'
import SaveStatus from './SaveStatus'
import GlobalSearch from './GlobalSearch'
import compassLogo from '../../assets/brand/compass-logo.png'

function NavButton({ id, label, isActive, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
        isActive ? 'bg-brand-cyan text-white shadow-sm' : 'text-slate-300 hover:bg-brand-navy-light hover:text-white'
      }`}
    >
      <span className="shrink-0">{ICONS[id]}</span>
      <span className="flex-1">{label}</span>
      {badge != null && (
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25 text-white' : 'bg-brand-navy-light text-slate-300'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

export default function Sidebar({ currentPage, onNavigate }) {
  const workers        = useAppStore((s) => s.workers)
  const openings       = useAppStore((s) => s.openings)
  const waitlist       = useAppStore((s) => s.waitlist)
  const furloughWorkers = useAppStore((s) => s.furloughWorkers)
  const breakfastItems = useAppStore((s) => s.breakfastItems)
  const attendanceRecords = useAppStore((s) => s.attendanceRecords)

  const activeCount    = workers.filter((w) => w.status === 'Active').length
  const furloughCount  = furloughWorkers.filter((w) => w.status === 'On Furlough').length
  const doneCount      = breakfastItems.filter((i) => i.done).length
  const atRiskCount    = attendanceRecords.filter(isAtRisk).length

  const badges = {
    workers:    activeCount,
    openings:   openings.length,
    waitlist:   waitlist.length,
    furlough:   furloughCount || undefined,
    attendance: atRiskCount || undefined,
    breakfast:  breakfastItems.length ? `${doneCount}/${breakfastItems.length}` : undefined,
  }

  return (
    <aside className="w-60 shrink-0 bg-brand-navy flex flex-col h-full print:hidden">
      {/* Brand — logo chip, clickable to Home */}
      <button onClick={() => onNavigate('home')} className="px-4 py-4 border-b border-white/10 text-left hover:bg-white/5 transition-colors">
        <div className="bg-white rounded-lg px-3 py-2.5 flex items-center justify-center">
          <img src={compassLogo} alt="Compass Minerals" className="h-7 w-auto" />
        </div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-2 text-center">YES Staffing Portal</div>
      </button>

      {/* Search */}
      <div className="px-3 pt-3">
        <GlobalSearch />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        <NavButton id="home" label="Home" isActive={currentPage === 'home'} onClick={() => onNavigate('home')} />
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavButton
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  isActive={currentPage === item.id}
                  badge={badges[item.id]}
                  onClick={() => onNavigate(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="px-3 py-3 border-t border-white/10">
        <NavButton id="settings" label="Settings" isActive={currentPage === 'settings'} onClick={() => onNavigate('settings')} />
        <SaveStatus />
      </div>
    </aside>
  )
}
