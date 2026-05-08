import { useState, useMemo, useRef, useEffect } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, flexRender,
} from '@tanstack/react-table'
import { useAppStore } from '../../store/useAppStore'
import AttendanceModal from './AttendanceModal'
import { DEPARTMENTS } from '../../lib/constants'

function IndeterminateCheckbox({ indeterminate, ...rest }) {
  const ref = useRef()
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate ?? false }, [indeterminate])
  return <input type="checkbox" ref={ref} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" {...rest} />
}

function getRisk(pts) {
  if (pts >= 8) return { label: 'Term Risk', cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400', tier: 4 }
  if (pts >= 7) return { label: 'Suspension', cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400', tier: 3 }
  if (pts >= 5) return { label: 'Written Up', cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400', tier: 2 }
  if (pts >= 3) return { label: 'Warning', cls: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400', tier: 1 }
  if (pts > 0)  return { label: 'Low', cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400', tier: 0 }
  return { label: 'Clear', cls: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400', tier: 0 }
}

function PtsBadge({ pts }) {
  const risk = getRisk(pts)
  const barColor =
    risk.tier >= 4 ? 'bg-red-500' :
    risk.tier >= 3 ? 'bg-orange-500' :
    risk.tier >= 2 ? 'bg-orange-400' :
    risk.tier >= 1 ? 'bg-yellow-400' :
    'bg-green-400'
  const pct = Math.min(100, (pts / 8) * 100)
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 w-6 text-right shrink-0">{pts}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const RISK_FILTERS = ['All', 'Warning (3+)', 'Written Up (5+)', 'Term Risk (8+)']

export default function AttendancePage() {
  const attendanceRecords       = useAppStore((s) => s.attendanceRecords)
  const addAttendanceRecord     = useAppStore((s) => s.addAttendanceRecord)
  const updateAttendanceRecord  = useAppStore((s) => s.updateAttendanceRecord)
  const deleteAttendanceRecord  = useAppStore((s) => s.deleteAttendanceRecord)
  const deleteAttendanceRecords = useAppStore((s) => s.deleteAttendanceRecords)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState(null)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState([])

  const filtered = useMemo(() => {
    return attendanceRecords.filter((r) => {
      if (deptFilter && r.department !== deptFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!`${r.firstName} ${r.lastName}`.toLowerCase().includes(q)) return false
      }
      if (riskFilter !== 'All') {
        const pts = r.attendancePoints || 0
        if (riskFilter === 'Warning (3+)'   && pts < 3) return false
        if (riskFilter === 'Written Up (5+)' && pts < 5) return false
        if (riskFilter === 'Term Risk (8+)'  && pts < 8) return false
      }
      return true
    })
  }, [attendanceRecords, deptFilter, search, riskFilter])

  // KPI counts (across all records, not filtered)
  const totalWorkers = attendanceRecords.length
  const atWarning    = attendanceRecords.filter((r) => (r.attendancePoints || 0) >= 3 && (r.attendancePoints || 0) < 5).length
  const writtenUp    = attendanceRecords.filter((r) => (r.attendancePoints || 0) >= 5 && (r.attendancePoints || 0) < 8).length
  const termRisk     = attendanceRecords.filter((r) => (r.attendancePoints || 0) >= 8).length
  const avgPts       = totalWorkers ? (attendanceRecords.reduce((s, r) => s + (r.attendancePoints || 0), 0) / totalWorkers).toFixed(1) : '0.0'

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
    {
      accessorKey: 'shift', header: 'Shift',
      cell: ({ getValue }) => getValue()
        ? <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">{getValue()}</span>
        : <span className="text-gray-400">—</span>,
    },
    { accessorKey: 'supervisor', header: 'Supervisor', cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    {
      accessorKey: 'attendancePoints', header: 'Points', size: 120,
      cell: ({ getValue }) => <PtsBadge pts={getValue() || 0} />,
    },
    {
      id: 'risk', header: 'Risk Level', size: 110,
      accessorFn: (r) => r.attendancePoints || 0,
      cell: ({ getValue }) => {
        const { label, cls } = getRisk(getValue())
        return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
      },
    },
    {
      accessorKey: 'wage', header: 'Wage',
      cell: ({ getValue }) => getValue() ? `$${Number(getValue()).toFixed(2)}` : <span className="text-gray-400">—</span>,
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
    initialState: { pagination: { pageSize: 25 } },
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track attendance points by worker</p>
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Workers',  value: totalWorkers, sub: 'on file',          color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', val: 'text-blue-700 dark:text-blue-400' },
          { label: 'Avg Points',     value: avgPts,       sub: 'per worker',        color: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',     val: 'text-gray-700 dark:text-gray-300' },
          { label: 'At Warning',     value: atWarning,    sub: '3–4 pts',           color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', val: 'text-yellow-700 dark:text-yellow-400' },
          { label: 'Written Up',     value: writtenUp,    sub: '5–7 pts',           color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', val: 'text-orange-700 dark:text-orange-400' },
          { label: 'Term Risk',      value: termRisk,     sub: '8+ pts',            color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',      val: 'text-red-700 dark:text-red-400' },
        ].map((k) => (
          <div key={k.label} className={`rounded-xl border p-5 ${k.color}`}>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.val}`}>{k.value}</div>
            {k.sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Point scale reference */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-4">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Attendance Point Scale</div>
        <div className="flex flex-wrap gap-3">
          {[
            { pts: '0–2', label: 'Clear', cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' },
            { pts: '3–4', label: 'Verbal Warning', cls: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' },
            { pts: '5–6', label: 'Written Up', cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' },
            { pts: '7',   label: 'Write Up + Suspension', cls: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' },
            { pts: '8+',  label: 'Termination', cls: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' },
          ].map((t) => (
            <div key={t.pts} className="flex items-center gap-2">
              <span className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-full ${t.cls}`}>{t.pts} pts</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{t.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="inline-flex text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400">NCNS ×2</span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Termination (2 consecutive)</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name..."
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
        />
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          {RISK_FILTERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        {(deptFilter || search || riskFilter !== 'All') && (
          <button onClick={() => { setDeptFilter(''); setSearch(''); setRiskFilter('All') }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Clear</button>
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
        {attendanceRecords.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">No attendance records yet.</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click "Add Record" to start tracking.</p>
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

      <AttendanceModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={(data) => { if (editing) updateAttendanceRecord(editing.id, data); else addAttendanceRecord(data) }}
        initial={editing}
      />

      {confirmDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete {confirmDeleteIds.length > 1 ? `${confirmDeleteIds.length} records` : 'record'}?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteIds(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={() => { confirmDeleteIds.length === 1 ? deleteAttendanceRecord(confirmDeleteIds[0]) : deleteAttendanceRecords(confirmDeleteIds); setConfirmDeleteIds(null); setRowSelection({}) }}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
