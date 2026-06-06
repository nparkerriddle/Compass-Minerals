import Sidebar from './Sidebar'

export default function Layout({ currentPage, onNavigate, children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 print:block print:h-auto print:overflow-visible">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      <main className="flex-1 overflow-y-auto print:overflow-visible">
        {children}
      </main>
    </div>
  )
}
