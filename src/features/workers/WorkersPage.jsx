import { useState, useMemo, useRef, useEffect } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, getFilteredRowModel, flexRender,
} from '@tanstack/react-table'
import { useAppStore } from '../../store/useAppStore'
import WorkerModal from './WorkerModal'
import { DEPARTMENTS, SHIFTS } from '../../lib/constants'
import { exportToCsv, exportBtnCls } from '../../lib/exportCsv'

function IndeterminateCheckbox({ indeterminate, ...rest }) {
  const ref = useRef()
  useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate ?? false }, [indeterminate])
  return (
    <input
      type="checkbox"
      ref={ref}
      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
      {...rest}
    />
  )
}

const STATUS_STYLES = {
  Active: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400',
  Termed: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
  DNA:    'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400',
}

export default function WorkersPage() {
  const workers = useAppStore((s) => s.workers)
  const addWorker = useAppStore((s) => s.addWorker)
  const updateWorker = useAppStore((s) => s.updateWorker)
  const deleteWorker = useAppStore((s) => s.deleteWorker)
  const deleteWorkers = useAppStore((s) => s.deleteWorkers)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState(null)

  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [shiftFilter, setShiftFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState([])

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      const name = `${w.firstName} ${w.lastName}`.toLowerCase()
      if (search && !name.includes(search.toLowerCase()) && !w.department.toLowerCase().includes(search.toLowerCase())) return false
      if (deptFilter && w.department !== deptFilter) return false
      if (shiftFilter && w.shift !== shiftFilter) return false
      if (statusFilter && w.status !== statusFilter) return false
      return true
    })
  }, [workers, search, deptFilter, shiftFilter, statusFilter])

  const columns = useMemo(() => [
    {
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <IndeterminateCheckbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <IndeterminateCheckbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      id: 'name',
      header: 'Name',
      accessorFn: (r) => `${r.firstName} ${r.lastName}`,
      cell: ({ getValue }) => <span className="font-medium text-gray-900 dark:text-gray-100">{getValue()}</span>,
    },
    { accessorKey: 'department', header: 'Department', cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    {
      accessorKey: 'shift',
      header: 'Shift',
      cell: ({ getValue }) => getValue()
        ? <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400">{getValue()}</span>
        : <span className="text-gray-400">—</span>,
    },
    { accessorKey: 'supervisor', header: 'Supervisor', cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    { accessorKey: 'daysWorked', header: 'Days', meta: { numeric: true }, cell: ({ getValue }) => getValue() || <span className="text-gray-400">—</span> },
    {
      accessorKey: 'wage',
      header: 'Wage',
      meta: { numeric: true },
      cell: ({ getValue }) => getValue() ? `$${Number(getValue()).toFixed(2)}/hr` : <span className="text-gray-400">—</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[getValue()] || ''}`}>
          {getValue()}
        </span>
      ),
    },
    {
      id: 'actions',
      size: 80,
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditing(row.original); setModalOpen(true) }}
            className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            onClick={() => setConfirmDeleteIds([row.original.id])}
            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ),
    },
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { rowSelection, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  const selectedIds = Object.keys(rowSelection)
    .filter((k) => rowSelection[k])
    .map((k) => filtered[Number(k)]?.id)
    .filter(Boolean)

  function handleSave(data) {
    if (editing) {
      updateWorker(editing.id, data)
    } else {
      addWorker(data)
    }
  }

  function handleConfirmDelete() {
    if (!confirmDeleteIds) return
    if (confirmDeleteIds.length === 1) {
      deleteWorker(confirmDeleteIds[0])
    } else {
      deleteWorkers(confirmDeleteIds)
    }
    setConfirmDeleteIds(null)
    setRowSelection({})
  }

  const { pageIndex, pageSize } = table.getState().pagination
  const totalRows = filtered.length
  const from = pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Workers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{workers.length} total records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv('compass-workers', [
              { key: 'firstName', label: 'First' }, { key: 'lastName', label: 'Last' },
              { key: 'department', label: 'Department' }, { key: 'shift', label: 'Shift' },
              { key: 'supervisor', label: 'Supervisor' }, { key: 'status', label: 'Status' },
              { key: 'daysWorked', label: 'Days Worked' }, { key: 'wage', label: 'Wage' },
              { key: 'termReason', label: 'Term Reason' }, { key: 'notes', label: 'Notes' },
            ], filtered)}
            className={exportBtnCls}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            Export CSV
          </button>
          <button
            onClick={() => { setEditing(null); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Worker
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="search"
          placeholder="Search name or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 w-56 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={shiftFilter} onChange={(e) => setShiftFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Shifts</option>
          {SHIFTS.map((s) => <option key={s} value={s}>Shift {s}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Termed">Termed</option>
          <option value="DNA">DNA</option>
        </select>
        {(search || deptFilter || shiftFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setDeptFilter(''); setShiftFilter(''); setStatusFilter('') }}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Clear
          </button>
        )}
        <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">{filtered.length} results</span>

        {selectedIds.length > 0 && (
          <button
            onClick={() => setConfirmDeleteIds(selectedIds)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete {selectedIds.length} selected
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={`px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${header.column.getCanSort() ? 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200' : ''} ${header.column.columnDef.meta?.numeric ? 'text-right' : 'text-left'}`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted()] ?? ''}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-gray-400 dark:text-gray-500">
                    No workers match your filters
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => { setEditing(row.original); setModalOpen(true) }}
                    className={`border-b border-gray-100 dark:border-gray-700/50 cursor-pointer transition-colors ${row.getIsSelected() ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={`px-3 py-2.5 text-gray-700 dark:text-gray-300 ${cell.column.columnDef.meta?.numeric ? 'text-right' : ''}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalRows > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Showing {from}–{to} of {totalRows}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ‹ Prev
              </button>
              <span className="px-2 text-xs text-gray-500">{pageIndex + 1} / {table.getPageCount()}</span>
              <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
                className="px-2 py-1 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal — mounted only while open so the form resets each time */}
      {modalOpen && (
        <WorkerModal
          isOpen={modalOpen}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          onSave={handleSave}
          initial={editing}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete {confirmDeleteIds.length > 1 ? `${confirmDeleteIds.length} workers` : 'worker'}?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteIds(null)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
              <button onClick={handleConfirmDelete} className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
