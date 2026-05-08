import { useState, useMemo, useRef, useEffect } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, flexRender,
} from '@tanstack/react-table'
import { useAppStore } from '../../store/useAppStore'
import FurloughModal from './FurloughModal'
import { DEPARTMENTS, FURLOUGH_SEASONS, WORKER_INTENTS, CLIENT_DECISIONS } from '../../lib/constants'

function IndeterminateCheckbox({ indeterminate, ...rest }) {
  const ref = useRef()
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate ?? false }, [indeterminate])
  return <input type="checkbox" ref={ref} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" {...rest} />
}

const STATUS_STYLES = {
  'On Furlough':    'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400',
  'Returned':       'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  'Did Not Return': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
}

const INTENT_STYLES = {
  'Wants to Return':          'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  'Does Not Want to Return':  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  'Unknown':                  'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

const DECISION_STYLES = {
  'Approved':     'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  'Not Approved': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  'Pending':      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
}

const INTENT_TILE = {
  'Wants to Return':          { wrap: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', val: 'text-green-700 dark:text-green-400' },
  'Does Not Want to Return':  { wrap: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', val: 'text-amber-700 dark:text-amber-400' },
  'Unknown':                  { wrap: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700', val: 'text-gray-600 dark:text-gray-400' },
}

const DECISION_TILE = {
  'Approved':     { wrap: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', val: 'text-green-700 dark:text-green-400' },
  'Not Approved': { wrap: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', val: 'text-red-700 dark:text-red-400' },
  'Pending':      { wrap: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', val: 'text-amber-700 dark:text-amber-400' },
}

// ── Documents ─────────────────────────────────────────────────────────────────
const DOCUMENTS = [
  {
    group: 'Leave Forms',
    description: 'Complete these when a worker goes on furlough',
    color: 'border-sky-500',
    badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400',
    files: [
      { name: 'Employment Termination / Leave of Absence Form', path: '/furlough-forms/leave/Employment Termination Leave of Absence Form.pdf', ext: 'PDF' },
      { name: 'DWS Form 653-D Deferral Verification Report', path: '/furlough-forms/leave/DWS Form 653-D Deferral Verification Report.pdf', ext: 'PDF' },
      { name: 'Furlough Leave Template', path: '/furlough-forms/leave/Furlough Leave Template.docx', ext: 'DOCX' },
      { name: 'Intent to Return Sign Up Sheet', path: '/furlough-forms/leave/Intent to Return Sign Up Sheet.docx', ext: 'DOCX' },
      { name: 'Intro to Unemployment', path: '/furlough-forms/leave/Intro to Unemployment.pdf', ext: 'PDF' },
    ],
  },
  {
    group: 'Return Forms',
    description: 'Complete these when a worker comes back',
    color: 'border-green-500',
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
    files: [
      { name: 'Furlough Return Template', path: '/furlough-forms/return/Furlough Return Template.docx', ext: 'DOCX' },
      { name: 'Furlough Return Guide (Manager)', path: '/furlough-forms/return/Furlough Return Guide (for manager use).docx', ext: 'DOCX' },
    ],
  },
  {
    group: '2024–2025 Season Templates',
    description: 'Season-specific pre-filled forms',
    color: 'border-purple-500',
    badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
    files: [
      { name: '24-25 Employee Termination Form Template', path: '/furlough-forms/seasons/24-25 Employee Termination Form Template.pdf', ext: 'PDF' },
      { name: '24-25 653-D Deferral Template', path: '/furlough-forms/seasons/24-25 653-D Template.pdf', ext: 'PDF' },
    ],
  },
  {
    group: '2025–2026 Season Templates',
    description: 'Season-specific pre-filled forms',
    color: 'border-indigo-500',
    badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400',
    files: [
      { name: '25-26 Employee Termination Form Template', path: '/furlough-forms/seasons/25-26 Employee Termination Form Template.pdf', ext: 'PDF' },
      { name: '25-26 Deferral Template', path: '/furlough-forms/seasons/25-26 Deferral Template.pdf', ext: 'PDF' },
    ],
  },
]

const EXT_STYLES = {
  PDF:  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  DOCX: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
}

const STEPS = [
  {
    phase: 'Leave',
    color: 'border-sky-500',
    badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400',
    steps: [
      { label: 'Employment Termination / Leave of Absence Form', detail: 'Worker signs before furlough begins' },
      { label: 'DWS Form 653-D Deferral Verification Report', detail: 'Submit to DWS for unemployment deferral' },
      { label: 'Intent to Return Sign Up Sheet', detail: 'Worker signs to confirm intent to return next season' },
      { label: 'Intro to Unemployment packet', detail: 'Provide to worker at time of furlough' },
    ],
  },
  {
    phase: 'Return',
    color: 'border-green-500',
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
    steps: [
      { label: 'Furlough Return Template', detail: 'Complete and submit before worker restarts' },
      { label: 'Manager reviews Furlough Return Guide', detail: 'Review return procedures and re-onboarding steps' },
      { label: 'Update worker status to "Returned"', detail: 'Update record in this system' },
    ],
  },
]

export default function FurloughPage() {
  const furloughWorkers    = useAppStore((s) => s.furloughWorkers)
  const addFurloughWorker  = useAppStore((s) => s.addFurloughWorker)
  const updateFurloughWorker = useAppStore((s) => s.updateFurloughWorker)
  const deleteFurloughWorker = useAppStore((s) => s.deleteFurloughWorker)
  const deleteFurloughWorkers = useAppStore((s) => s.deleteFurloughWorkers)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState(null)
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState([])

  const filtered = useMemo(() => {
    return furloughWorkers.filter((w) => {
      if (deptFilter && w.department !== deptFilter) return false
      if (statusFilter && w.status !== statusFilter) return false
      if (seasonFilter && w.season !== seasonFilter) return false
      return true
    })
  }, [furloughWorkers, deptFilter, statusFilter, seasonFilter])

  const onFurlough  = furloughWorkers.filter((w) => w.status === 'On Furlough').length
  const returned    = furloughWorkers.filter((w) => w.status === 'Returned').length
  const didNotReturn = furloughWorkers.filter((w) => w.status === 'Did Not Return').length

  const intentCounts = useMemo(() => {
    const map = Object.fromEntries(WORKER_INTENTS.map((k) => [k, 0]))
    filtered.forEach((w) => { const k = w.workerIntent || 'Unknown'; if (map[k] !== undefined) map[k]++ })
    return map
  }, [filtered])

  const decisionCounts = useMemo(() => {
    const map = Object.fromEntries(CLIENT_DECISIONS.map((k) => [k, 0]))
    filtered.forEach((w) => { const k = w.clientDecision || 'Pending'; if (map[k] !== undefined) map[k]++ })
    return map
  }, [filtered])

  const matrix = useMemo(() => {
    const m = {}
    WORKER_INTENTS.forEach((i) => {
      m[i] = {}
      CLIENT_DECISIONS.forEach((d) => { m[i][d] = 0 })
    })
    filtered.forEach((w) => {
      const intent = w.workerIntent || 'Unknown'
      const decision = w.clientDecision || 'Pending'
      if (m[intent]?.[decision] !== undefined) m[intent][decision]++
    })
    return m
  }, [filtered])

  const columns = useMemo(() => [
    {
      id: 'select', size: 40,
      header: ({ table }) => <IndeterminateCheckbox checked={table.getIsAllPageRowsSelected()} indeterminate={table.getIsSomePageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />,
      cell: ({ row }) => <IndeterminateCheckbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} onClick={(e) => e.stopPropagation()} />,
    },
    {
      id: 'name', header: 'Name',
      accessorFn: (r) => `${r.firstName} ${r.lastName}`,
      cell: ({ getValue }) => <span className="font-medium text-gray-900 dark:text-gray-100">{getValue()}</span>,
    },
    { accessorKey: 'department', header: 'Department', cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    { accessorKey: 'shift', header: 'Shift', cell: ({ getValue }) => getValue()
      ? <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">{getValue()}</span>
      : <span className="text-gray-400">—</span> },
    { accessorKey: 'season', header: 'Season', cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    { accessorKey: 'furloughDate', header: 'Left', cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    { accessorKey: 'expectedReturn', header: 'Expected Return', cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    {
      accessorKey: 'status', header: 'Status',
      cell: ({ getValue }) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[getValue()] || ''}`}>{getValue()}</span>
      ),
    },
    {
      accessorKey: 'leaveFormComplete', header: 'Leave Docs', size: 90,
      cell: ({ getValue }) => getValue()
        ? <span className="text-green-600 dark:text-green-400 text-xs font-medium">✓ Done</span>
        : <span className="text-amber-500 text-xs">Pending</span>,
    },
    {
      accessorKey: 'workerIntent', header: 'Intent', size: 120,
      cell: ({ getValue }) => {
        const v = getValue() || 'Unknown'
        return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${INTENT_STYLES[v]}`}>{v}</span>
      },
    },
    {
      accessorKey: 'clientDecision', header: 'Client', size: 110,
      cell: ({ getValue }) => {
        const v = getValue() || 'Pending'
        return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${DECISION_STYLES[v]}`}>{v}</span>
      },
    },
    {
      id: 'actions', size: 80, header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { setEditing(row.original); setModalOpen(true) }}
            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button onClick={() => setConfirmDeleteIds([row.original.id])}
            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data: filtered, columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]).map((k) => filtered[Number(k)]?.id).filter(Boolean)
  const { pageIndex, pageSize } = table.getState().pagination
  const from = pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, filtered.length)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Furlough</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Seasonal off-period tracking</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Record
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'On Furlough',    value: onFurlough,   color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800', val: 'text-sky-700 dark:text-sky-400' },
          { label: 'Returned',       value: returned,     color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800', val: 'text-green-700 dark:text-green-400' },
          { label: 'Did Not Return', value: didNotReturn, color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', val: 'text-red-700 dark:text-red-400' },
        ].map((k) => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.color}`}>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.val}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Return Analysis */}
      {filtered.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Return Analysis</h2>

          {/* Worker Intent row */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Worker Intent</div>
            <div className="grid grid-cols-3 gap-3">
              {WORKER_INTENTS.map((k) => {
                const t = INTENT_TILE[k]
                return (
                  <div key={k} className={`rounded-lg border p-3 ${t.wrap}`}>
                    <div className={`text-2xl font-bold ${t.val}`}>{intentCounts[k]}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{k}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Client Decision row */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Client Decision</div>
            <div className="grid grid-cols-3 gap-3">
              {CLIENT_DECISIONS.map((k) => {
                const t = DECISION_TILE[k]
                return (
                  <div key={k} className={`rounded-lg border p-3 ${t.wrap}`}>
                    <div className={`text-2xl font-bold ${t.val}`}>{decisionCounts[k]}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-tight">{k}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cross-tab matrix */}
          <div>
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Breakdown Matrix</div>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 text-left">Worker Intent</th>
                    {CLIENT_DECISIONS.map((d) => (
                      <th key={d} className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">{d}</th>
                    ))}
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {WORKER_INTENTS.map((intent, i) => {
                    const rowTotal = CLIENT_DECISIONS.reduce((sum, d) => sum + matrix[intent][d], 0)
                    return (
                      <tr key={intent} className={`border-b border-gray-100 dark:border-gray-700/50 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-900/20'}`}>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${INTENT_STYLES[intent]}`}>{intent}</span>
                        </td>
                        {CLIENT_DECISIONS.map((d) => (
                          <td key={d} className="px-4 py-2.5 text-center font-semibold text-gray-700 dark:text-gray-300">
                            {matrix[intent][d] || <span className="text-gray-300 dark:text-gray-600">—</span>}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 text-center text-xs font-bold text-gray-500 dark:text-gray-400">{rowTotal || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400">Total</td>
                    {CLIENT_DECISIONS.map((d) => (
                      <td key={d} className="px-4 py-2.5 text-center text-xs font-bold text-gray-500 dark:text-gray-400">
                        {decisionCounts[d] || <span className="text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-center text-xs font-bold text-gray-700 dark:text-gray-300">{filtered.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option>On Furlough</option><option>Returned</option><option>Did Not Return</option>
        </select>
        <select value={seasonFilter} onChange={(e) => setSeasonFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Seasons</option>
          {FURLOUGH_SEASONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {(deptFilter || statusFilter || seasonFilter) && (
          <button onClick={() => { setDeptFilter(''); setStatusFilter(''); setSeasonFilter('') }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Clear</button>
        )}
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{filtered.length} records</span>
        {selectedIds.length > 0 && (
          <button onClick={() => setConfirmDeleteIds(selectedIds)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">
            Delete {selectedIds.length} selected
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {furloughWorkers.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No furlough records yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click "Add Record" to start tracking seasonal workers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {hg.headers.map((header) => (
                      <th key={header.id} style={{ width: header.getSize() }}
                        className={`px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-left ${header.column.getCanSort() ? 'cursor-pointer hover:text-gray-700' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted()] ?? ''}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} onClick={() => { setEditing(row.original); setModalOpen(true) }}
                    className={`border-b border-gray-100 dark:border-gray-700/50 cursor-pointer transition-colors ${row.getIsSelected() ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500">{from}–{to} of {filtered.length}</span>
            <div className="flex gap-1">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2 py-1 text-sm text-gray-600 rounded hover:bg-gray-100 disabled:opacity-40">‹ Prev</button>
              <span className="px-2 text-xs text-gray-500">{pageIndex + 1} / {table.getPageCount()}</span>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-2 py-1 text-sm text-gray-600 rounded hover:bg-gray-100 disabled:opacity-40">Next ›</button>
            </div>
          </div>
        )}
      </div>

      {/* Process Steps Reference */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Process Reference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STEPS.map((phase) => (
            <div key={phase.phase} className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 ${phase.color} border border-gray-200 dark:border-gray-700 p-5`}>
              <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${phase.badge}`}>{phase.phase}</span>
              <ol className="space-y-3">
                {phase.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{step.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{step.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {/* Forms & Documents */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Forms &amp; Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DOCUMENTS.map((group) => (
            <div key={group.group} className={`bg-white dark:bg-gray-800 rounded-xl border-l-4 ${group.color} border border-gray-200 dark:border-gray-700 p-5`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${group.badge}`}>{group.group}</span>
              </div>
              {group.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{group.description}</p>
              )}
              <ul className="space-y-1.5">
                {group.files.map((file) => (
                  <li key={file.path}>
                    <a
                      href={file.path}
                      download
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group transition-colors"
                    >
                      <span className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${EXT_STYLES[file.ext]}`}>{file.ext}</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex-1 leading-tight">{file.name}</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <FurloughModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(data) => { if (editing) updateFurloughWorker(editing.id, data); else addFurloughWorker(data) }} initial={editing} />

      {confirmDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete {confirmDeleteIds.length > 1 ? `${confirmDeleteIds.length} records` : 'record'}?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteIds(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={() => { confirmDeleteIds.length === 1 ? deleteFurloughWorker(confirmDeleteIds[0]) : deleteFurloughWorkers(confirmDeleteIds); setConfirmDeleteIds(null); setRowSelection({}) }}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
