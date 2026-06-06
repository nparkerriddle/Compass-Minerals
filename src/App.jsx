import Layout from './components/layout/Layout'
import { useAppStore } from './store/useAppStore'
import HomePage from './features/home/HomePage'
import OverviewPage from './features/overview/OverviewPage'
import DepartmentsPage from './features/departments/DepartmentsPage'
import WorkersPage from './features/workers/WorkersPage'
import StaffingPage from './features/staffing/StaffingPage'
import OpeningsPage from './features/openings/OpeningsPage'
import WaitlistPage from './features/waitlist/WaitlistPage'
import FurloughPage from './features/furlough/FurloughPage'
import AttendancePage from './features/attendance/AttendancePage'
import AttritionPage from './features/attrition/AttritionPage'
import BreakfastPage from './features/breakfast/BreakfastPage'
import ReportsPage from './features/reports/ReportsPage'
import QBRPage from './features/qbr/QBRPage'
import FinancialsPage from './features/financials/FinancialsPage'
import PayrollPage from './features/payroll/PayrollPage'
import SettingsPage from './features/settings/SettingsPage'

const PAGES = {
  home: HomePage,
  overview: OverviewPage,
  departments: DepartmentsPage,
  workers: WorkersPage,
  staffing: StaffingPage,
  openings: OpeningsPage,
  waitlist: WaitlistPage,
  furlough: FurloughPage,
  attendance: AttendancePage,
  attrition: AttritionPage,
  breakfast: BreakfastPage,
  reports: ReportsPage,
  qbr: QBRPage,
  financials: FinancialsPage,
  payroll: PayrollPage,
  settings: SettingsPage,
}

export default function App() {
  const currentPage = useAppStore((s) => s.currentPage)
  const navigate = useAppStore((s) => s.navigate)
  const Page = PAGES[currentPage] ?? HomePage

  return (
    <Layout currentPage={currentPage} onNavigate={navigate}>
      <Page />
    </Layout>
  )
}
