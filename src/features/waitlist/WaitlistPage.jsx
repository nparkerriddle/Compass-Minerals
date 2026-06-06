import { useState, useMemo, useRef, useEffect } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, flexRender,
} from '@tanstack/react-table'
import { useAppStore } from '../../store/useAppStore'
import WaitlistModal from './WaitlistModal'
import { DEPARTMENTS } from '../../lib/constants'

function IndeterminateCheckbox({ indeterminate, ...rest }) {
  const ref = useRef()
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate ?? false }, [indeterminate])
  return <input type="checkbox" ref={ref} className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" {...rest} />
}

const STATUS_STYLES = {
  Pending:     'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',
  'Wait List': 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400',
  Furlough:    'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
  Inactive:    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
}

export default function WaitlistPage() {
  const waitlist = useAppStore((s) => s.waitlist)
  const addWaitlistEntry = useAppStore((s) => s.addWaitlistEntry)
  const updateWaitlistEntry = useAppStore((s) => s.updateWaitlistEntry)
  const deleteWaitlistEntry = useAppStore((s) => s.deleteWaitlistEntry)
  const deleteWaitlistEntries = useAppStore((s) => s.deleteWaitlistEntries)
  const placeWaitlistEntry = useAppStore((s) => s.placeWaitlistEntry)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState(null)
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState([])

  const filtered = useMemo(() => {
    return waitlist.filter((e) => {
      if (deptFilter && e.department !== deptFilter) return false
      if (statusFilter && e.status !== statusFilter) return false
      return true
    })
  }, [waitlist, deptFilter, statusFilter])

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
    { accessorKey: 'preferredShift', header: 'Pref. Shift', cell: ({ getValue }) => getValue() || <span className="text-gray-400">Any</span> },
    { accessorKey: 'phone', header: 'Phone', cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    {
      accessorKey: 'status', header: 'Status',
      cell: ({ getValue }) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[getValue()] || ''}`}>{getValue()}</span>
      ),
    },
    { accessorKey: 'notes', header: 'Notes', cell: ({ getValue }) => <span className="text-gray-500 dark:text-gray-400 max-w-xs truncate block">{getValue() || '—'}</span> },
    {
      id: 'actions', size: 80, header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => placeWaitlistEntry(row.original.id)} title="Place → Active roster"
            className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5l-7.5 7.5L7.5 11.25M3 12a9 9 0 1018 0 9 9 0 00-18 0z" />
            </svg>
          </button>
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
  ], [placeWaitlistEntry])

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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Waitlist</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{waitlist.length} candidates</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Candidate
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option>Pending</option>
          <option>Wait List</option>
          <option>Furlough</option>
          <option>Inactive</option>
        </select>
        {(deptFilter || statusFilter) && (
          <button onClick={() => { setDeptFilter(''); setStatusFilter('') }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Clear</button>
        )}
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{filtered.length} results</span>
        {selectedIds.length > 0 && (
          <button onClick={() => setConfirmDeleteIds(selectedIds)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
            Delete {selectedIds.length} selected
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
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
              {table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-gray-400">No candidates found</td></tr>
              ) : table.getRowModel().rows.map((row) => (
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
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Showing {from}–{to} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-2 py-1 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">‹ Prev</button>
              <span className="px-2 text-xs text-gray-500">{pageIndex + 1} / {table.getPageCount()}</span>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-2 py-1 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">Next ›</button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <WaitlistModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={(data) => { if (editing) updateWaitlistEntry(editing.id, data); else addWaitlistEntry(data) }} initial={editing} />
      )}

      {confirmDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete {confirmDeleteIds.length > 1 ? `${confirmDeleteIds.length} candidates` : 'candidate'}?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteIds(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={() => { confirmDeleteIds.length === 1 ? deleteWaitlistEntry(confirmDeleteIds[0]) : deleteWaitlistEntries(confirmDeleteIds); setConfirmDeleteIds(null); setRowSelection({}) }}
                className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
