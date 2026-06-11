import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { sampleData } from '../lib/sampleData'
import { serverStorage } from '../lib/serverStorage'
import { attendanceStatus } from '../lib/attendance'

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

function initWorkers(data = compassData) {
  const active = (data.activeWorkers || []).map(w => ({
    id: makeId(), ...splitName(w.name),
    department: w.department || '', shift: w.shift || '', supervisor: w.supervisor || '',
    startDate: '', daysWorked: w.daysWorked || 0, wage: w.wage || 0,
    status: 'Active', termReason: '', notes: '',
    photoDone: w.photoDone === 'Yes', truckSignOff: w.truckSignOff === 'Yes',
    stockpileTesting: w.stockpileTesting === 'Yes', operatorSignOff: w.operatorSignOff === 'Yes',
    physicalExpiration: w.physicalExpiration || '',
  }))
  const termed = (data.termedWorkers || []).map(w => ({
    id: makeId(), ...splitName(w.name),
    department: w.department || '', shift: '', supervisor: '',
    startDate: '', daysWorked: w.daysWorked || 0, wage: 0,
    status: w.status === 'DNA' ? 'DNA' : 'Termed',
    termReason: w.termReason || '', notes: '',
  }))
  return [...active, ...termed]
}

function initOpenings(data = compassData) {
  return (data.openings || []).map(o => ({
    id: makeId(), department: o.department || '', position: o.position || '',
    dateReceived: o.dateReceived || '', openingsCount: o.openings || 1, notes: '',
  }))
}

function initIncidents(data = compassData) {
  return (data.incidents || []).map(x => ({
    id: makeId(), ...splitName(x.name),
    date: x.date || '', time: x.time || '',
    department: x.department || '', shift: x.shift || '', supervisor: x.supervisor || '',
    daysWorked: x.daysWorked || 0, outcome: x.outcome || '', notes: x.notes || '',
  }))
}

function initFurloughWorkers(data = compassData) {
  return (data.furloughWorkers || []).map(w => ({
    id: makeId(), ...splitName(w.name),
    department: w.department || '', shift: w.shift || '', supervisor: w.supervisor || '',
    furloughDate: '', expectedReturn: '', actualReturn: '',
    season: '2025-2026', status: 'On Furlough',
    leaveFormComplete: false, returnFormComplete: false,
    workerIntent: 'Unknown', clientDecision: 'Pending',
    notes: w.seasonsWorked ? `Seasons worked: ${w.seasonsWorked}` : '',
  }))
}

function initWaitlist(data = compassData) {
  return (data.waitlist || []).map(w => ({
    id: makeId(), ...splitName(w.name),
    department: w.department || '', preferredShift: w.preferredShift || '',
    phone: '', status: w.status || 'Pending', notes: w.notes || '',
  }))
}

function initAttendanceRecords(data = compassData) {
  return (data.rosterWorkers || []).map(w => ({
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

// ── Activity log helpers ──────────────────────────────────────────────────────
const MAX_LOG = 250
const logEntry = (action, entity, label) => ({ id: makeId(), action, entity, label, at: new Date().toISOString() })
const withLog = (s, action, entity, label) => [logEntry(action, entity, label), ...s.activityLog].slice(0, MAX_LOG)
const nameOf = (r) => r ? `${r.firstName || ''} ${r.lastName || ''}`.trim() || '(unnamed)' : '(unknown)'

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
      furloughWorkers: initFurloughWorkers(),
      attendanceRecords: initAttendanceRecords(),
      breakfastItems: initBreakfastItems(),
      breakfastNotes: initBreakfastNotes(),
      financials: initFinancials(),
      incidents: initIncidents(),
      activityLog: [],
      snapshots: [],
      darkMode: false,

      // Activity log
      clearActivityLog: () => set({ activityLog: [] }),

      // Trends — point-in-time snapshots of headline metrics
      captureSnapshot: () => set((s) => {
        const active = s.workers.filter((w) => w.status === 'Active')
        const snap = {
          id: makeId(),
          date: new Date().toISOString().slice(0, 10),
          label: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          active: active.length,
          openPositions: s.openings.reduce((a, o) => a + (o.openingsCount || 1), 0),
          waitlist: s.waitlist.length,
          onFurlough: s.furloughWorkers.filter((w) => w.status === 'On Furlough').length,
          termed: s.workers.filter((w) => w.status === 'Termed').length,
          dna: s.workers.filter((w) => w.status === 'DNA').length,
          atRisk: s.attendanceRecords.filter((r) => attendanceStatus(r).tier >= 3).length,
        }
        return { snapshots: [...s.snapshots, snap], activityLog: withLog(s, 'Captured', 'Snapshot', snap.label) }
      }),
      deleteSnapshot: (id) => set((s) => ({ snapshots: s.snapshots.filter((x) => x.id !== id) })),

      // Refresh worker data from a freshly parsed Compass Tracker (in-app import)
      importFromData: (data) => set((s) => ({
        workers: initWorkers(data),
        openings: initOpenings(data),
        waitlist: initWaitlist(data),
        furloughWorkers: initFurloughWorkers(data),
        attendanceRecords: initAttendanceRecords(data),
        incidents: initIncidents(data),
        activityLog: withLog(s, 'Imported', 'Tracker', `${(data.activeWorkers || []).length} active workers`),
      })),

      // Workers
      addWorker: (w) => set((s) => { const n = { ...w, id: makeId() }; return { workers: [...s.workers, n], activityLog: withLog(s, 'Added', 'Worker', nameOf(n)) } }),
      updateWorker: (id, u) => set((s) => ({ workers: s.workers.map((w) => w.id === id ? { ...w, ...u } : w), activityLog: withLog(s, 'Edited', 'Worker', nameOf(s.workers.find((w) => w.id === id))) })),
      deleteWorker: (id) => set((s) => ({ workers: s.workers.filter((w) => w.id !== id), activityLog: withLog(s, 'Deleted', 'Worker', nameOf(s.workers.find((w) => w.id === id))) })),
      deleteWorkers: (ids) => set((s) => ({ workers: s.workers.filter((w) => !ids.includes(w.id)), activityLog: withLog(s, 'Deleted', 'Workers', `${ids.length} records`) })),

      // ── Status transitions (move a person between stages) ──
      // Active → Termed/DNA (in place)
      terminateWorker: (id, { status = 'Termed', termReason = '' } = {}) => set((s) => ({
        workers: s.workers.map((w) => w.id === id ? { ...w, status, termReason } : w),
        activityLog: withLog(s, 'Moved', 'Worker', `${nameOf(s.workers.find((w) => w.id === id))} → ${status}`),
      })),
      // Termed/DNA → Active (rehire, in place)
      rehireWorker: (id) => set((s) => ({
        workers: s.workers.map((w) => w.id === id ? { ...w, status: 'Active', termReason: '' } : w),
        activityLog: withLog(s, 'Rehired', 'Worker', nameOf(s.workers.find((w) => w.id === id))),
      })),
      // Active → Furlough (transfer)
      moveWorkerToFurlough: (id) => set((s) => {
        const w = s.workers.find((x) => x.id === id)
        if (!w) return {}
        const today = new Date().toISOString().slice(0, 10)
        const f = {
          id: makeId(), firstName: w.firstName, lastName: w.lastName,
          department: w.department || '', shift: w.shift || '', supervisor: w.supervisor || '',
          furloughDate: today, expectedReturn: '', actualReturn: '', season: '2025-2026',
          status: 'On Furlough', leaveFormComplete: false, returnFormComplete: false,
          workerIntent: 'Unknown', clientDecision: 'Pending', wage: w.wage || 0, notes: '',
        }
        return { workers: s.workers.filter((x) => x.id !== id), furloughWorkers: [...s.furloughWorkers, f], activityLog: withLog(s, 'Moved', 'Worker', `${nameOf(w)} → Furlough`) }
      }),
      // Active → Waitlist (transfer)
      moveWorkerToWaitlist: (id) => set((s) => {
        const w = s.workers.find((x) => x.id === id)
        if (!w) return {}
        const e = { id: makeId(), firstName: w.firstName, lastName: w.lastName, department: w.department || '', preferredShift: w.shift || '', phone: '', status: 'Wait List', notes: '' }
        return { workers: s.workers.filter((x) => x.id !== id), waitlist: [...s.waitlist, e], activityLog: withLog(s, 'Moved', 'Worker', `${nameOf(w)} → Waitlist`) }
      }),
      // Waitlist → Active (placement)
      placeWaitlistEntry: (id) => set((s) => {
        const e = s.waitlist.find((x) => x.id === id)
        if (!e) return {}
        const today = new Date().toISOString().slice(0, 10)
        const w = {
          id: makeId(), firstName: e.firstName, lastName: e.lastName,
          department: e.department || '', shift: e.preferredShift || '', supervisor: '',
          startDate: today, daysWorked: 0, wage: 0, status: 'Active', termReason: '', notes: 'Placed from waitlist',
        }
        return { waitlist: s.waitlist.filter((x) => x.id !== id), workers: [...s.workers, w], activityLog: withLog(s, 'Placed', 'Waitlist', `${nameOf(e)} → Active`) }
      }),

      // Openings
      addOpening: (o) => set((s) => { const n = { ...o, id: makeId() }; return { openings: [...s.openings, n], activityLog: withLog(s, 'Added', 'Opening', `${n.department} ${n.position || ''}`.trim()) } }),
      updateOpening: (id, u) => set((s) => ({ openings: s.openings.map((o) => o.id === id ? { ...o, ...u } : o), activityLog: withLog(s, 'Edited', 'Opening', (s.openings.find((o) => o.id === id) || {}).department || '') })),
      deleteOpening: (id) => set((s) => ({ openings: s.openings.filter((o) => o.id !== id), activityLog: withLog(s, 'Deleted', 'Opening', (s.openings.find((o) => o.id === id) || {}).department || '') })),

      // Waitlist
      addWaitlistEntry: (e) => set((s) => { const n = { ...e, id: makeId() }; return { waitlist: [...s.waitlist, n], activityLog: withLog(s, 'Added', 'Waitlist', nameOf(n)) } }),
      updateWaitlistEntry: (id, u) => set((s) => ({ waitlist: s.waitlist.map((e) => e.id === id ? { ...e, ...u } : e), activityLog: withLog(s, 'Edited', 'Waitlist', nameOf(s.waitlist.find((e) => e.id === id))) })),
      deleteWaitlistEntry: (id) => set((s) => ({ waitlist: s.waitlist.filter((e) => e.id !== id), activityLog: withLog(s, 'Deleted', 'Waitlist', nameOf(s.waitlist.find((e) => e.id === id))) })),
      deleteWaitlistEntries: (ids) => set((s) => ({ waitlist: s.waitlist.filter((e) => !ids.includes(e.id)), activityLog: withLog(s, 'Deleted', 'Waitlist', `${ids.length} records`) })),

      // Furlough
      addFurloughWorker: (w) => set((s) => { const n = { ...w, id: makeId() }; return { furloughWorkers: [...s.furloughWorkers, n], activityLog: withLog(s, 'Added', 'Furlough', nameOf(n)) } }),
      updateFurloughWorker: (id, u) => set((s) => ({ furloughWorkers: s.furloughWorkers.map((w) => w.id === id ? { ...w, ...u } : w), activityLog: withLog(s, 'Edited', 'Furlough', nameOf(s.furloughWorkers.find((w) => w.id === id))) })),
      deleteFurloughWorker: (id) => set((s) => ({ furloughWorkers: s.furloughWorkers.filter((w) => w.id !== id), activityLog: withLog(s, 'Deleted', 'Furlough', nameOf(s.furloughWorkers.find((w) => w.id === id))) })),
      deleteFurloughWorkers: (ids) => set((s) => ({ furloughWorkers: s.furloughWorkers.filter((w) => !ids.includes(w.id)), activityLog: withLog(s, 'Deleted', 'Furlough', `${ids.length} records`) })),
      // Reactivate a furloughed worker into the active roster
      reactivateFurloughWorker: (id) => set((s) => {
        const f = s.furloughWorkers.find((w) => w.id === id)
        if (!f) return {}
        const today = new Date().toISOString().slice(0, 10)
        const worker = {
          id: makeId(), firstName: f.firstName, lastName: f.lastName,
          department: f.department || '', shift: f.shift || '', supervisor: f.supervisor || '',
          startDate: today, daysWorked: 0, wage: f.wage || 0,
          status: 'Active', termReason: '', notes: 'Returned from furlough',
        }
        return {
          workers: [...s.workers, worker],
          furloughWorkers: s.furloughWorkers.map((w) => w.id === id ? { ...w, status: 'Returned', actualReturn: today } : w),
          activityLog: withLog(s, 'Returned', 'Furlough', `${nameOf(f)} → active`),
        }
      }),

      // Attendance
      addAttendanceRecord: (r) => set((s) => { const n = { ...r, id: makeId() }; return { attendanceRecords: [...s.attendanceRecords, n], activityLog: withLog(s, 'Added', 'Attendance', nameOf(n)) } }),
      updateAttendanceRecord: (id, u) => set((s) => ({ attendanceRecords: s.attendanceRecords.map((r) => r.id === id ? { ...r, ...u } : r), activityLog: withLog(s, 'Edited', 'Attendance', nameOf(s.attendanceRecords.find((r) => r.id === id))) })),
      deleteAttendanceRecord: (id) => set((s) => ({ attendanceRecords: s.attendanceRecords.filter((r) => r.id !== id), activityLog: withLog(s, 'Deleted', 'Attendance', nameOf(s.attendanceRecords.find((r) => r.id === id))) })),
      deleteAttendanceRecords: (ids) => set((s) => ({ attendanceRecords: s.attendanceRecords.filter((r) => !ids.includes(r.id)), activityLog: withLog(s, 'Deleted', 'Attendance', `${ids.length} records`) })),

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

      // Financials (monthly P&L)
      addFinancialMonth: (m) => set((s) => ({ financials: [...s.financials, { ...m, id: makeId() }] })),
      updateFinancialMonth: (id, u) => set((s) => ({ financials: s.financials.map((m) => m.id === id ? { ...m, ...u } : m) })),
      deleteFinancialMonth: (id) => set((s) => ({ financials: s.financials.filter((m) => m.id !== id) })),

      // Safety / incidents
      addIncident: (x) => set((s) => { const n = { ...x, id: makeId() }; return { incidents: [...s.incidents, n], activityLog: withLog(s, 'Added', 'Incident', nameOf(n)) } }),
      updateIncident: (id, u) => set((s) => ({ incidents: s.incidents.map((i) => i.id === id ? { ...i, ...u } : i), activityLog: withLog(s, 'Edited', 'Incident', nameOf(s.incidents.find((i) => i.id === id))) })),
      deleteIncident: (id) => set((s) => ({ incidents: s.incidents.filter((i) => i.id !== id), activityLog: withLog(s, 'Deleted', 'Incident', nameOf(s.incidents.find((i) => i.id === id))) })),

      // Settings
      toggleDarkMode: () => set((s) => {
        const next = !s.darkMode
        document.documentElement.classList.toggle('dark', next)
        return { darkMode: next }
      }),
    }),
    {
      name: 'compass-dashboard-v2',
      // Persist to the server (SQLite via /api/state), never to the browser.
      storage: createJSONStorage(() => serverStorage),
      // Don't persist navigation state
      partialize: (state) => ({
        workers: state.workers,
        openings: state.openings,
        waitlist: state.waitlist,
        furloughWorkers: state.furloughWorkers,
        attendanceRecords: state.attendanceRecords,
        breakfastItems: state.breakfastItems,
        breakfastNotes: state.breakfastNotes,
        financials: state.financials,
        incidents: state.incidents,
        activityLog: state.activityLog,
        snapshots: state.snapshots,
        bookmarks: state.bookmarks,
        darkMode: state.darkMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) document.documentElement.classList.add('dark')
      },
    }
  )
)
