import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sampleData } from '../lib/sampleData'

// Load real extracted data if present. The file is gitignored (worker PII),
// so on a fresh clone it won't exist — import.meta.glob resolves to an empty
// object instead of failing the build, and we fall back to the empty sample.
const dataModules = import.meta.glob('../data/compass-data.json', { eager: true })
const compassData = dataModules['../data/compass-data.json']?.default ?? sampleData

function makeId() { return crypto.randomUUID() }

function splitName(fullName) {
  const parts = String(fullName || '').trim().split(' ')
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') }
}

// ── Initial data loaders ──────────────────────────────────────────────────────

function initWorkers() {
  const active = (compassData.activeWorkers || []).map(w => ({
    id: makeId(), ...splitName(w.name),
    department: w.department || '', shift: w.shift || '', supervisor: w.supervisor || '',
    startDate: '', daysWorked: w.daysWorked || 0, wage: w.wage || 0,
    status: 'Active', termReason: '', notes: '',
  }))
  const termed = (compassData.termedWorkers || []).map(w => ({
    id: makeId(), ...splitName(w.name),
    department: w.department || '', shift: '', supervisor: '',
    startDate: '', daysWorked: w.daysWorked || 0, wage: 0,
    status: w.status === 'DNA' ? 'DNA' : 'Termed',
    termReason: w.termReason || '', notes: '',
  }))
  return [...active, ...termed]
}

function initOpenings() {
  return (compassData.openings || []).map(o => ({
    id: makeId(), department: o.department || '', position: o.position || '',
    dateReceived: o.dateReceived || '', openingsCount: o.openings || 1, notes: '',
  }))
}

function initWaitlist() {
  return (compassData.waitlist || []).map(w => ({
    id: makeId(), ...splitName(w.name),
    department: w.department || '', preferredShift: w.preferredShift || '',
    phone: '', status: w.status || 'Pending', notes: w.notes || '',
  }))
}

function initAttendanceRecords() {
  return (compassData.rosterWorkers || []).map(w => ({
    id: makeId(),
    ...splitName(w.name),
    department: w.department || '',
    shift: w.shift || '',
    supervisor: w.supervisor || '',
    attendancePoints: w.attendancePoints || 0,
    ncns: w.ncns || 0,
    daysOnAssignment: w.daysOnAssignment || 0,
    wage: w.wage || 0,
    notes: '',
  }))
}

function initBreakfastItems() {
  const items = [
    { item: 'Krustiez Pancake Mix', amount: '5–6 total' },
    { item: 'Bacon (Pre Cooked)', amount: '28 Total' },
    { item: 'Sausage (Pre Cooked)', amount: '22 Total' },
    { item: 'Pre Cut Fruit', amount: '3 platters per day' },
    { item: 'Syrup', amount: '6–8 Jugs Total' },
    { item: 'Sugar Free Syrup', amount: '2 Total' },
    { item: 'Juice (OJ)', amount: '7 per day' },
    { item: 'Water', amount: '3 Cases Total' },
    { item: 'Paper Plates', amount: '400 count Total' },
    { item: 'Butter', amount: '1 Big (main area), 1 Small (Salt Plant)' },
    { item: 'Spray Butter', amount: '2 Total' },
    { item: 'Table Cloth', amount: '6 Total' },
    { item: 'Metal Pans', amount: '20 Total' },
    { item: 'Whisk / Egg Beater', amount: '1 Total' },
    { item: 'Coffers', amount: '3 Total' },
    { item: 'Lighter', amount: '1 Total' },
    { item: 'Tongs', amount: '5 Total' },
    { item: 'Spatula', amount: '2 Total' },
    { item: 'Forks & Knives', amount: 'Enough for 400 people' },
    { item: 'Cups', amount: 'Enough for 400 people' },
    { item: 'Measuring Cup', amount: '1 Total' },
    { item: 'Mixing Bowl', amount: '1 Total' },
  ]
  return items.map(i => ({ id: makeId(), ...i, done: false }))
}

// Actual vs AOP (Annual Operating Plan) headcount — from the Haul Shift Roster.
function initStaffingPlan() {
  const rows = [
    { role: 'Haul Truck Drivers', actual: 40, target: 40 },
    { role: 'Scraper Operators',   actual: 0,  target: 0 },
    { role: 'Water Truck Drivers', actual: 0,  target: 2 },
    { role: 'Supervisors',         actual: 3,  target: 4 },
  ]
  return rows.map(r => ({ id: makeId(), ...r }))
}

// Monthly P&L summary — from Compass Financials - Monthly.xlsx.
function initFinancials() {
  const rows = [
    { month: 'Aug 2024',  income: 163033.20, grossProfit: 35281.30, netIncome: 30459.99 },
    { month: 'Sep 2024',  income: 338271.40, grossProfit: 69374.61, netIncome: 61164.93 },
    { month: 'Oct 2024',  income: 395684.38, grossProfit: 80986.02, netIncome: 74845.13 },
    { month: 'Jan 2025',  income: 444096.33, grossProfit: 89596.71, netIncome: 82446.32 },
  ]
  return rows.map(r => ({ id: makeId(), ...r }))
}

function initBreakfastNotes() {
  const notes = [
    '225 people per day — plan for 2–3 pcs of each item per person',
    'Shop at Costco',
    'Arrive at 5:15am. Tables set up by 5:30am',
    'Light coffers and grill by 5:40am',
    'Spray Butter prevents burning',
    'Preheat Sausage and Bacon in microwaves, then finish on the grill',
    'Start cooking by 5:50am',
    'Make pancake mix onsite — DO NOT TRANSPORT IT',
    'Should be all done and wrapped up by 8:30am',
    'Ask Sherry for grill and griddle 1 week before event',
    'Take griddle home and scrub it clean after',
    'Notify HR and Sherry a month in advance so they can tell the site',
    'Notify YES execs to get volunteers to help cook',
    'Once done, take three tins of pancakes, sausage and bacon to Salt Plant',
    'Breakfast is on a Tuesday and Thursday morning',
  ]
  return notes.map((text, i) => ({ id: makeId(), text, order: i }))
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAppStore = create(
  persist(
    (set) => ({
      // Navigation (currentPage not persisted)
      currentPage: 'home',
      navigate: (page) => set({ currentPage: page }),

      // Bookmarked sections for quick access on the Home page (persisted)
      bookmarks: ['overview', 'attendance', 'reports'],
      toggleBookmark: (id) => set((s) => ({
        bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id],
      })),

      // Data
      workers: initWorkers(),
      openings: initOpenings(),
      waitlist: initWaitlist(),
      furloughWorkers: [],
      attendanceRecords: initAttendanceRecords(),
      breakfastItems: initBreakfastItems(),
      breakfastNotes: initBreakfastNotes(),
      staffingPlan: initStaffingPlan(),
      financials: initFinancials(),
      darkMode: false,

      // Workers
      addWorker: (w) => set((s) => ({ workers: [...s.workers, { ...w, id: makeId() }] })),
      updateWorker: (id, u) => set((s) => ({ workers: s.workers.map((w) => w.id === id ? { ...w, ...u } : w) })),
      deleteWorker: (id) => set((s) => ({ workers: s.workers.filter((w) => w.id !== id) })),
      deleteWorkers: (ids) => set((s) => ({ workers: s.workers.filter((w) => !ids.includes(w.id)) })),

      // Openings
      addOpening: (o) => set((s) => ({ openings: [...s.openings, { ...o, id: makeId() }] })),
      updateOpening: (id, u) => set((s) => ({ openings: s.openings.map((o) => o.id === id ? { ...o, ...u } : o) })),
      deleteOpening: (id) => set((s) => ({ openings: s.openings.filter((o) => o.id !== id) })),

      // Waitlist
      addWaitlistEntry: (e) => set((s) => ({ waitlist: [...s.waitlist, { ...e, id: makeId() }] })),
      updateWaitlistEntry: (id, u) => set((s) => ({ waitlist: s.waitlist.map((e) => e.id === id ? { ...e, ...u } : e) })),
      deleteWaitlistEntry: (id) => set((s) => ({ waitlist: s.waitlist.filter((e) => e.id !== id) })),
      deleteWaitlistEntries: (ids) => set((s) => ({ waitlist: s.waitlist.filter((e) => !ids.includes(e.id)) })),

      // Furlough
      addFurloughWorker: (w) => set((s) => ({ furloughWorkers: [...s.furloughWorkers, { ...w, id: makeId() }] })),
      updateFurloughWorker: (id, u) => set((s) => ({ furloughWorkers: s.furloughWorkers.map((w) => w.id === id ? { ...w, ...u } : w) })),
      deleteFurloughWorker: (id) => set((s) => ({ furloughWorkers: s.furloughWorkers.filter((w) => w.id !== id) })),
      deleteFurloughWorkers: (ids) => set((s) => ({ furloughWorkers: s.furloughWorkers.filter((w) => !ids.includes(w.id)) })),

      // Attendance
      addAttendanceRecord: (r) => set((s) => ({ attendanceRecords: [...s.attendanceRecords, { ...r, id: makeId() }] })),
      updateAttendanceRecord: (id, u) => set((s) => ({ attendanceRecords: s.attendanceRecords.map((r) => r.id === id ? { ...r, ...u } : r) })),
      deleteAttendanceRecord: (id) => set((s) => ({ attendanceRecords: s.attendanceRecords.filter((r) => r.id !== id) })),
      deleteAttendanceRecords: (ids) => set((s) => ({ attendanceRecords: s.attendanceRecords.filter((r) => !ids.includes(r.id)) })),

      // Breakfast items
      addBreakfastItem: (item) => set((s) => ({ breakfastItems: [...s.breakfastItems, { ...item, id: makeId(), done: false }] })),
      updateBreakfastItem: (id, u) => set((s) => ({ breakfastItems: s.breakfastItems.map((i) => i.id === id ? { ...i, ...u } : i) })),
      toggleBreakfastItem: (id) => set((s) => ({ breakfastItems: s.breakfastItems.map((i) => i.id === id ? { ...i, done: !i.done } : i) })),
      deleteBreakfastItem: (id) => set((s) => ({ breakfastItems: s.breakfastItems.filter((i) => i.id !== id) })),
      resetBreakfastItems: () => set((s) => ({ breakfastItems: s.breakfastItems.map((i) => ({ ...i, done: false })) })),

      // Breakfast notes
      addBreakfastNote: (text) => set((s) => ({ breakfastNotes: [...s.breakfastNotes, { id: makeId(), text, order: s.breakfastNotes.length }] })),
      updateBreakfastNote: (id, text) => set((s) => ({ breakfastNotes: s.breakfastNotes.map((n) => n.id === id ? { ...n, text } : n) })),
      deleteBreakfastNote: (id) => set((s) => ({ breakfastNotes: s.breakfastNotes.filter((n) => n.id !== id) })),

      // Staffing plan (Actual vs AOP)
      addStaffingRole: (r) => set((s) => ({ staffingPlan: [...s.staffingPlan, { ...r, id: makeId() }] })),
      updateStaffingRole: (id, u) => set((s) => ({ staffingPlan: s.staffingPlan.map((r) => r.id === id ? { ...r, ...u } : r) })),
      deleteStaffingRole: (id) => set((s) => ({ staffingPlan: s.staffingPlan.filter((r) => r.id !== id) })),

      // Financials (monthly P&L)
      addFinancialMonth: (m) => set((s) => ({ financials: [...s.financials, { ...m, id: makeId() }] })),
      updateFinancialMonth: (id, u) => set((s) => ({ financials: s.financials.map((m) => m.id === id ? { ...m, ...u } : m) })),
      deleteFinancialMonth: (id) => set((s) => ({ financials: s.financials.filter((m) => m.id !== id) })),

      // Settings
      toggleDarkMode: () => set((s) => {
        const next = !s.darkMode
        document.documentElement.classList.toggle('dark', next)
        return { darkMode: next }
      }),
    }),
    {
      name: 'compass-dashboard-v1',
      // Don't persist navigation state
      partialize: (state) => ({
        workers: state.workers,
        openings: state.openings,
        waitlist: state.waitlist,
        furloughWorkers: state.furloughWorkers,
        attendanceRecords: state.attendanceRecords,
        breakfastItems: state.breakfastItems,
        breakfastNotes: state.breakfastNotes,
        staffingPlan: state.staffingPlan,
        financials: state.financials,
        bookmarks: state.bookmarks,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) document.documentElement.classList.add('dark')
      },
    }
  )
)
