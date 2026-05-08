import Layout from './components/layout/Layout'
import { useAppStore } from './store/useAppStore'
import OverviewPage from './features/overview/OverviewPage'
import WorkersPage from './features/workers/WorkersPage'
import OpeningsPage from './features/openings/OpeningsPage'
import WaitlistPage from './features/waitlist/WaitlistPage'
import FurloughPage from './features/furlough/FurloughPage'
import AttendancePage from './features/attendance/AttendancePage'
import AttritionPage from './features/attrition/AttritionPage'
import BreakfastPage from './features/breakfast/BreakfastPage'
import SettingsPage from './features/settings/SettingsPage'

const PAGES = {
  overview: OverviewPage,
  workers: WorkersPage,
  openings: OpeningsPage,
  waitlist: WaitlistPage,
  furlough: FurloughPage,
  attendance: AttendancePage,
  attrition: AttritionPage,
  breakfast: BreakfastPage,
  settings: SettingsPage,
}

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage)
  const navigate = useAppStore((s) => s.navigate)
  const Page = PAGES[currentPage] ?? OverviewPage

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      <Page />
    </Layout>
  )
}
