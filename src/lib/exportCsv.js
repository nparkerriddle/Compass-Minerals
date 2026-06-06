// Tiny CSV exporter. `columns` = [{ key, label, get? }], `rows` = array of objects.
function cell(value) {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function exportToCsv(filename, columns, rows) {
  const header = columns.map((c) => cell(c.label ?? c.key)).join(',')
  const body = rows
    .map((row) => columns.map((c) => cell(c.get ? c.get(row) : row[c.key])).join(','))
    .join('\n')
  const csv = `${header}\n${body}`

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Shared button styling for export actions.
export const exportBtnCls =
  'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
